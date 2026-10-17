import sys
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import discord
from discord.ext import commands
from discord import app_commands
import yt_dlp
import os
import re
import shutil
import ffmpeg
import aiohttp
import asyncio
import datetime
from dotenv import load_dotenv

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()

TOKEN = os.getenv('DISCORD_TOKEN')
WEBHOOK_URL = os.getenv('WEBHOOK_URL')
MAX_FILE_SIZE = 24 * 1024 * 1024  # 24MB

if not TOKEN:
    raise ValueError("❌ Error: DISCORD_TOKEN missing from environment variables (.env).")

if not WEBHOOK_URL or "discord.com/api/webhooks" not in WEBHOOK_URL:
    print("\n" + "="*60)
    print("⚠️  MISSING WEBHOOK_URL in .env file!")
    print("👉 To run this standalone Python bot:")
    print("   1. Go to your Discord channel -> Channel Settings (⚙️) -> Integrations -> Webhooks")
    print("   2. Create a Webhook and click 'Copy Webhook URL'")
    print("   3. Add it to your .env file:")
    print("      WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE")
    print("="*60 + "\n")
    raise ValueError("Error: Valid WEBHOOK_URL is required in .env to run instagram_downloader.py")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True


class InstagramBot(commands.Bot):
    async def setup_hook(self):
        # 1. Load Welcome Cog if present
        if os.path.exists("cogs/Welcome/welcome.py"):
            try:
                await self.load_extension("cogs.Welcome.welcome")
                print("👋 Loaded Welcome Cog successfully!")
            except Exception as e:
                print(f"⚠️ Failed to load Welcome Cog: {e}")

        # 2. Register / Sync global slash command tree
        try:
            synced = await self.tree.sync()
            print(f"🌐 Registered {len(synced)} global slash commands with Discord!")
        except Exception as e:
            print(f"⚠️ Global command tree sync notice: {e}")


bot = InstagramBot(command_prefix="!", intents=intents)

TARGET_CHANNEL_ID = None
processing_links = set()

# --- DEFINE 30 AUTO REACTION EMOJIS ---
REACTION_EMOJIS = [
    "❤️", "😂", "🔥", "😮", "👍",
    "👀", "👑", "🌟", "💯", "🎉",
    "✨", "💥", "🙌", "🤩", "😈",
    "💀", "🚨", "🎯", "⚡", "🔮",
    "🤖", "📈", "🤫", "🥶", "🤯",
    "🍀", "🥳", "🛸", "🍕", "🦾"
]


def smart_compress(input_path, output_path):
    """Calculates the exact bitrate needed to make the video fit 24MB."""
    try:
        probe = ffmpeg.probe(input_path)
        duration = float(probe['format']['duration'])

        target_total_bitrate = (MAX_FILE_SIZE * 8) / duration
        video_bitrate = target_total_bitrate * 0.9
        audio_bitrate = target_total_bitrate * 0.1

        print(f"--- Compressing: {os.path.basename(input_path)} ---")
        (
            ffmpeg
            .input(input_path)
            .output(output_path,
                    video_bitrate=video_bitrate,
                    audio_bitrate=audio_bitrate,
                    vcodec='libx264',
                    acodec='aac')
            .overwrite_output()
            .run(quiet=True)
        )
        return output_path
    except Exception as e:
        print(f"Compression Error: {e}")
        return input_path


async def download_instagram(url):
    """Downloads the video using yt-dlp with multiple fallback strategies."""
    if os.path.exists('downloads'):
        try:
            shutil.rmtree('downloads')
        except:
            pass
    os.makedirs('downloads', exist_ok=True)

    base_opts = {
        'outtmpl': 'downloads/%(id)s.%(ext)s',
        'quiet': False,
        'no_warnings': False,
        'merge_output_format': 'mp4',
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
                          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 '
                          'Mobile/15E148 Safari/604.1',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.instagram.com/',
        },
        'extractor_args': {
            'instagram': {
                'include_dash_manifest': ['true'],
            }
        },
        'retries': 5,
        'fragment_retries': 5,
        'socket_timeout': 30,
    }

    if os.path.exists('cookies.txt'):
        base_opts['cookiefile'] = 'cookies.txt'
        print("🔑 cookies.txt detected — using authenticated session.")
    else:
        print("⚠️  No cookies.txt found. Attempting anonymous download...")

    clean_url = re.sub(r'\?.*$', '', url.rstrip('/'))

    strategies = [
        ("Standard download", clean_url, {}),
        ("With /?__a=1 API hint", clean_url + "/", {'format': 'best'}),
        ("Fallback best format", clean_url, {'format': 'best', 'merge_output_format': 'mp4'}),
    ]

    for desc, try_url, extra in strategies:
        opts = {**base_opts, **extra}
        print(f"🔄 Trying: {desc}")
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(try_url, download=True)
                if info is None:
                    continue

                filename = ydl.prepare_filename(info)

                if not os.path.exists(filename):
                    files = os.listdir('downloads')
                    if files:
                        filename = os.path.join('downloads', files[0])
                    else:
                        continue

                if not filename.endswith('.mp4'):
                    new_name = os.path.splitext(filename)[0] + '.mp4'
                    if os.path.exists(filename) and filename != new_name:
                        os.rename(filename, new_name)
                    filename = new_name

                if os.path.exists(filename) and os.path.getsize(filename) > 0:
                    print(f"   ✅ Success! File: {filename}")
                    return filename
        except Exception as e:
            print(f"   ↳ Error: {e}")
            try:
                shutil.rmtree('downloads')
                os.makedirs('downloads', exist_ok=True)
            except:
                pass

    print("❌ All download strategies failed.")
    return None


async def send_to_webhook(file_path, user):
    """Sends the compressed video via Webhook and returns the message reference."""
    async with aiohttp.ClientSession() as session:
        webhook = discord.Webhook.from_url(WEBHOOK_URL, session=session)
        with open(file_path, 'rb') as f:
            webhook_message = await webhook.send(
                content=f"👤 **Requested by:** {user.mention}",
                username="INSTAGRAM DOWNLOAD LINK",
                avatar_url="https://cdn.discordapp.com/attachments/1447917590663008329/1515632984240296007/image.png",
                file=discord.File(f, filename="video.mp4"),
                wait=True
            )
            return webhook_message


@bot.event
async def on_ready():
    global TARGET_CHANNEL_ID
    print("⏳ Resolving target channel from Webhook...")
    
    # Auto-fetch the exact channel ID from the webhook config
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(WEBHOOK_URL) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    channel_id = data.get('channel_id')
                    if channel_id:
                        TARGET_CHANNEL_ID = int(channel_id)
                        print(f"🎯 Target Channel Auto-Locked to ID: {TARGET_CHANNEL_ID}")
                else:
                    print(f"⚠️ Webhook response failed with status: {resp.status}")
        except Exception as e:
            print(f"⚠️ Startup error resolving Webhook metadata: {e}")

    # Instant guild-level sync for all servers so new commands update immediately without 1hr wait
    for guild in bot.guilds:
        try:
            bot.tree.copy_global_to(guild=guild)
            synced_guild = await bot.tree.sync(guild=guild)
            print(f"⚡ Instantly updated {len(synced_guild)} command(s) for guild: {guild.name} ({guild.id})")
        except Exception as e:
            print(f"⚠️ Guild sync notice for {guild.name}: {e}")

    print(f'✅ Logged in as {bot.user.name} (Single Server Mode Active)')


# --- SLASH COMMAND: /download ---
@bot.tree.command(name="download", description="📥 Download and upload an Instagram Reel or Post video directly")
@app_commands.describe(url="Direct link to Instagram Reel or Post")
async def slash_download(interaction: discord.Interaction, url: str):
    url_match = re.search(
        r"(https?://(?:www\.)?instagram\.com/(?:p|reels|reel)/[^\s?/]+(?:/[^\s?]*)?)",
        url
    )
    if not url_match:
        return await interaction.response.send_message(
            "❌ Invalid Instagram URL! Please provide a valid link starting with `https://instagram.com/reel/` or `https://instagram.com/p/`.",
            ephemeral=True
        )

    clean_url = url_match.group(1)
    if clean_url in processing_links:
        return await interaction.response.send_message(
            "⏳ That Instagram link is already being downloaded! Please wait a moment.",
            ephemeral=True
        )

    await interaction.response.defer(thinking=True)
    processing_links.add(clean_url)

    try:
        video_file = await download_instagram(clean_url)

        if video_file and os.path.exists(video_file):
            final_file = video_file

            if os.path.getsize(video_file) > MAX_FILE_SIZE:
                await interaction.edit_original_response(content="⚙️ **Video is large. Compressing to fit Discord...**")
                compressed_file = video_file.replace(".mp4", "_min.mp4")
                final_file = smart_compress(video_file, compressed_file)

            await interaction.edit_original_response(content="📤 **Uploading video via Webhook...**")
            partial_webhook_msg = await send_to_webhook(final_file, interaction.user)
            await interaction.delete_original_response()

            if partial_webhook_msg:
                try:
                    real_channel_msg = await interaction.channel.fetch_message(partial_webhook_msg.id)
                    for emoji in REACTION_EMOJIS:
                        try:
                            await real_channel_msg.add_reaction(emoji)
                            await asyncio.sleep(0.25)
                        except Exception as e:
                            print(f"Reaction failed {emoji}: {e}")
                except Exception as fetch_err:
                    print(f"Could not fetch webhook message: {fetch_err}")
        else:
            await interaction.edit_original_response(
                content=(
                    "❌ **Download failed.**\n"
                    "> The post may be private, age-restricted, or Instagram is blocking the request.\n"
                    "> **Fix:** Upload a valid `cookies.txt` file to your bot's root folder and restart."
                )
            )
    except Exception as e:
        await interaction.edit_original_response(content=f"❌ **Error during download:** `{e}`")
    finally:
        processing_links.discard(clean_url)
        if os.path.exists('downloads'):
            try:
                shutil.rmtree('downloads')
            except:
                pass


# --- SLASH COMMAND: /sync ---
@bot.tree.command(name="sync", description="🔄 Force update and re-sync every new command to this server instantly")
@app_commands.checks.has_permissions(administrator=True)
async def slash_sync(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    try:
        bot.tree.copy_global_to(guild=interaction.guild)
        synced = await bot.tree.sync(guild=interaction.guild)
        await bot.tree.sync()
        await interaction.followup.send(
            f"✅ **Every new command has been updated and synced successfully!**\n"
            f"• **Commands Synced:** `{len(synced)}` to **{interaction.guild.name}**\n"
            f"• **Available Commands:** `/download`, `/welcome channel`, `/welcome message`, `/welcome banner`, `/welcome test`, `/sync`, `/info`\n"
            f"⚡ All commands are live in your server right now!",
            ephemeral=True
        )
    except Exception as e:
        await interaction.followup.send(f"❌ Failed to sync commands: `{e}`", ephemeral=True)


# --- PREFIX COMMAND: !sync ---
@bot.command(name="sync")
@commands.has_permissions(administrator=True)
async def prefix_sync(ctx):
    """Admin fallback command: !sync to update every new command."""
    try:
        status = await ctx.send("⏳ Updating and syncing every new command...")
        bot.tree.copy_global_to(guild=ctx.guild)
        synced = await bot.tree.sync(guild=ctx.guild)
        await bot.tree.sync()
        await status.edit(content=f"✅ **Every new command updated!** `{len(synced)}` commands synced to **{ctx.guild.name}** instantly!")
    except Exception as e:
        await ctx.send(f"❌ Error syncing commands: `{e}`")


# --- SLASH COMMAND: /info ---
@bot.tree.command(name="info", description="ℹ️ Display bot status, active channel, and available commands")
async def slash_info(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🤖 Instagram Downloader & Onboarding Bot",
        color=0x3498db,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.add_field(name="🎯 Auto-Download Channel", value=f"<#{TARGET_CHANNEL_ID}>" if TARGET_CHANNEL_ID else "`Auto-detected`", inline=True)
    embed.add_field(name="📦 Max Video Size", value="24 MB (Smart Compression)", inline=True)
    embed.add_field(name="❤️ Reactions Added", value=f"{len(REACTION_EMOJIS)} emojis auto-react", inline=True)
    embed.add_field(
        name="📜 Available Commands",
        value=(
            "• `/download [url]` — Download Instagram Reel / Post\n"
            "• `/welcome channel [channel]` — Configure welcome text channel\n"
            "• `/welcome message [text] [send_dm]` — Configure welcome greeting & DMs\n"
            "• `/welcome banner [image_url]` — Configure welcome banner\n"
            "• `/welcome test` — Test welcome mockup broadcast\n"
            "• `/sync` — Update every command instantly\n"
            "• `/info` — View bot status and details"
        ),
        inline=False
    )
    embed.set_footer(text="© 2026 | Developed by HL.Hansraj Labs | All Rights Reserved.")
    await interaction.response.send_message(embed=embed, ephemeral=True)


# --- AUTOMATIC ON_MESSAGE HANDLER FOR INSTAGRAM LINKS ---
@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Process standard prefix commands (e.g. !sync)
    await bot.process_commands(message)

    # Only process automatic download for messages coming from the locked Webhook channel
    if TARGET_CHANNEL_ID is None or message.channel.id != TARGET_CHANNEL_ID:
        return

    url_match = re.search(
        r"(https?://(?:www\.)?instagram\.com/(?:p|reels|reel)/[^\s?/]+(?:/[^\s?]*)?)",
        message.content
    )

    if url_match:
        clean_url = url_match.group(1)

        if clean_url in processing_links:
            return
        processing_links.add(clean_url)

        status_msg = await message.channel.send("⏳ **Downloading from Instagram...**")

        # Delete original message
        try:
            await message.delete()
        except:
            pass

        try:
            video_file = await download_instagram(clean_url)

            if video_file and os.path.exists(video_file):
                final_file = video_file

                if os.path.getsize(video_file) > MAX_FILE_SIZE:
                    await status_msg.edit(content="⚙️ **Video is large. Compressing...**")
                    compressed_file = video_file.replace(".mp4", "_min.mp4")
                    final_file = smart_compress(video_file, compressed_file)

                await status_msg.edit(content="📤 **Uploading...**")
                partial_webhook_msg = await send_to_webhook(final_file, message.author)
                await status_msg.delete()

                # Add 30 reactions
                if partial_webhook_msg:
                    try:
                        real_channel_msg = await message.channel.fetch_message(partial_webhook_msg.id)
                        for emoji in REACTION_EMOJIS:
                            try:
                                await real_channel_msg.add_reaction(emoji)
                                await asyncio.sleep(0.25)
                            except Exception as e:
                                print(f"Reaction failed {emoji}: {e}")
                    except Exception as fetch_err:
                        print(f"Could not fetch webhook message: {fetch_err}")
            else:
                await status_msg.edit(
                    content=(
                        "❌ **Download failed.**\n"
                        "> The post may be private, age-restricted, or Instagram is blocking the request.\n"
                        "> **Fix:** Upload a valid `cookies.txt` file to your bot's root folder and restart."
                    ),
                    delete_after=20
                )

        except Exception as e:
            try:
                await status_msg.edit(content=f"❌ **Error:** `{e}`", delete_after=15)
            except:
                pass

        finally:
            processing_links.discard(clean_url)
            if os.path.exists('downloads'):
                try:
                    shutil.rmtree('downloads')
                except:
                    pass


if __name__ == '__main__':
    bot.run(TOKEN)
