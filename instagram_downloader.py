import sys
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import discord
from discord.ext import commands
import yt_dlp
import os
import re
import shutil
import ffmpeg
import aiohttp
import asyncio
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
bot = commands.Bot(command_prefix="!", intents=intents)

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

    print(f'✅ Logged in as {bot.user.name} (Single Server Mode Active)')


@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Only process messages coming from the locked Webhook channel
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
