import discord
from discord.ext import commands
from discord import app_commands
import json
import os
import datetime

class Welcome(commands.GroupCog, name="welcome"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        # Support both relative working directory and absolute script path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_path = os.path.join(base_dir, "welcome_config.json")
        self.config = self.load_config()
        super().__init__()

    def load_config(self):
        """Loads welcome configurations from local storage securely."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        # Also check fallback relative path if needed
        fallback_path = "./cogs/Welcome/welcome_config.json"
        if os.path.exists(fallback_path):
            try:
                with open(fallback_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save_config(self):
        """Saves current configurations to JSON format."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"❌ Welcome config write failure: {e}")

    def init_guild(self, guild_id: str):
        """Initializes default welcome data structures for new servers."""
        if guild_id not in self.config:
            self.config[guild_id] = {
                "channel_id": None,
                "message": "Welcome {user} to the {server} matrix!",
                "banner_url": None,
                "send_dm": False,
                "second_message": None,
                "second_message_enabled": False,
                "second_message_as_embed": False
            }
        else:
            if "send_dm" not in self.config[guild_id]:
                self.config[guild_id]["send_dm"] = False
            if "second_message" not in self.config[guild_id]:
                self.config[guild_id]["second_message"] = None
                self.config[guild_id]["second_message_enabled"] = False
                self.config[guild_id]["second_message_as_embed"] = False

    @app_commands.command(name="channel", description="Configure the target channel where welcome messages will be posted.")
    @app_commands.describe(channel="Text channel to route user onboarding alerts")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def set_channel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        guild_id = str(interaction.guild_id)
        self.init_guild(guild_id)
        
        self.config[guild_id]["channel_id"] = str(channel.id)
        self.save_config()
        
        embed = discord.Embed(
            title="👋 Onboarding Channel Configured",
            description=f"Welcome greeting broadcasts have been routed to {channel.mention}.",
            color=0x2ecc71,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="message", description="Configure customized greeting text message pattern and DM settings.")
    @app_commands.describe(
        text="Dynamic greeting text. Supported tags: {user} = mention, {server} = server name, {member_count} = member count",
        send_dm="Should the welcome message also be sent directly to the user's DMs?"
    )
    @app_commands.checks.has_permissions(manage_guild=True)
    async def set_message(self, interaction: discord.Interaction, text: str, send_dm: bool = False):
        guild_id = str(interaction.guild_id)
        self.init_guild(guild_id)
        
        self.config[guild_id]["message"] = text
        self.config[guild_id]["send_dm"] = send_dm
        self.save_config()
        
        status_dm = "✅ **ENABLED**" if send_dm else "❌ **DISABLED**"
        
        embed = discord.Embed(
            title="📝 Onboarding Template Updated",
            description=f"Welcome text string successfully configured to:\n```\n{text}\n```\n• **Direct Message (DM) Delivery:** {status_dm}",
            color=0x3498db,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_footer(text="Tags verified: {user}, {server}, {member_count}")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="second_message", description="Configure a customized second follow-up message sent after the welcome greeting.")
    @app_commands.describe(
        text="Custom text for the second message (Tags: {user}, {server}, {member_count})",
        as_embed="Send second message as an embed card box? (Default: False)",
        enabled="Enable or disable sending this second message (Default: True)"
    )
    @app_commands.checks.has_permissions(manage_guild=True)
    async def set_second_message(self, interaction: discord.Interaction, text: str, as_embed: bool = False, enabled: bool = True):
        guild_id = str(interaction.guild_id)
        self.init_guild(guild_id)

        self.config[guild_id]["second_message"] = text
        self.config[guild_id]["second_message_as_embed"] = as_embed
        self.config[guild_id]["second_message_enabled"] = enabled
        self.save_config()

        status_text = "✅ **ENABLED**" if enabled else "❌ **DISABLED**"
        format_text = "📦 **Embed Card Box**" if as_embed else "💬 **Plain Text Message**"

        embed = discord.Embed(
            title="📬 Second Follow-Up Message Configured",
            description=f"Your second message has been configured:\n```\n{text}\n```\n• **Status:** ${status_text}\n• **Format:** ${format_text}",
            color=0x3498db,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_footer(text="Tags verified: {user}, {server}, {member_count}")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="banner", description="Configure the image URL background design to showcase with the greeting.")
    @app_commands.describe(image_url="A direct web URL to a JPEG/PNG welcome banner image")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def set_banner(self, interaction: discord.Interaction, image_url: str):
        guild_id = str(interaction.guild_id)
        self.init_guild(guild_id)
        
        # Simple validation for image URL format
        if not image_url.lower().startswith(("http://", "https://")):
            return await interaction.response.send_message(
                "❌ Verification Error: Please provide a valid web URL starting with `http://` or `https://`.",
                ephemeral=True
            )
        
        self.config[guild_id]["banner_url"] = image_url
        self.save_config()
        
        embed = discord.Embed(
            title="🖼️ Onboarding Banner Saved",
            description="Your custom welcome banner has been configured successfully.",
            color=0x9b59b6,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_image(url=image_url)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="test", description="Dispatches a mockup greeting to test the current welcome configuration.")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def test_welcome(self, interaction: discord.Interaction):
        guild_id = str(interaction.guild_id)
        self.init_guild(guild_id)
        
        settings = self.config[guild_id]
        channel_id = settings.get("channel_id")
        
        if not channel_id:
            return await interaction.response.send_message(
                "❌ Execution Block: Please configure an onboarding text channel first using `/welcome channel`.",
                ephemeral=True
            )
            
        channel = interaction.guild.get_channel(int(channel_id))
        if not channel:
            return await interaction.response.send_message(
                "❌ Route Error: Configured channel could not be found. Please update `/welcome channel`.",
                ephemeral=True
            )

        # Build dynamic payload mockup
        raw_msg = settings.get("message", "Welcome {user} to {server}!")
        formatted_msg = raw_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name).replace("{member_count}", str(interaction.guild.member_count))

        embed = discord.Embed(
            title="✨ New Connection Established (Mockup Test)",
            description=formatted_msg,
            color=0x9b59b6,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_thumbnail(url=interaction.user.display_avatar.url)
        embed.add_field(name="Account Age Identity", value=interaction.user.created_at.strftime("%B %d, %Y"), inline=True)
        embed.add_field(name="Guild Member Count", value=f"`{interaction.guild.member_count}` Total", inline=True)
        embed.set_footer(text=f"User ID: {interaction.user.id}")
        
        banner_url = settings.get("banner_url")
        if banner_url:
            embed.set_image(url=banner_url)

        # Post mock text channel message
        channel_success = False
        try:
            await channel.send(embed=embed)
            channel_success = True
        except discord.Forbidden:
            pass

        # Send second message if enabled
        if settings.get("second_message_enabled", False) and settings.get("second_message"):
            raw_second = settings["second_message"]
            formatted_second = raw_second.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name).replace("{member_count}", str(interaction.guild.member_count))
            try:
                if settings.get("second_message_as_embed", False):
                    sec_embed = discord.Embed(description=formatted_second, color=0xffd700)
                    await channel.send(embed=sec_embed)
                else:
                    await channel.send(formatted_second)
            except Exception:
                pass

        # Post mock DM if enabled
        dm_status = ""
        if settings.get("send_dm", False):
            try:
                dm_embed = discord.Embed(
                    title=f"✨ Welcome to {interaction.guild.name}! (Mockup DM)",
                    description=formatted_msg,
                    color=0x9b59b6,
                    timestamp=datetime.datetime.now(datetime.timezone.utc)
                )
                dm_embed.set_thumbnail(url=interaction.user.display_avatar.url)
                if banner_url:
                    dm_embed.set_image(url=banner_url)
                dm_embed.set_footer(text=f"Sent dynamically via welcome configurations")
                
                await interaction.user.send(embed=dm_embed)
                dm_status = "\n📩 **DM Mockup Dispatch:** Sent successfully to your direct messages!"
            except discord.Forbidden:
                dm_status = "\n⚠️ **DM Mockup Dispatch Failed:** Your direct messages are locked; cannot send welcome mockup."

        if channel_success:
            await interaction.response.send_message(f"✅ Dynamic Test Broadcast: Onboarding greeting sent successfully to {channel.mention}.{dm_status}", ephemeral=True)
        else:
            await interaction.response.send_message(f"❌ Permissions Error: Missing permission settings to send embeds inside configured channel.{dm_status}", ephemeral=True)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild_id = str(member.guild.id)
        if guild_id not in self.config:
            return
            
        settings = self.config[guild_id]
        raw_msg = settings.get("message", "Welcome {user} to {server}!")
        formatted_msg = raw_msg.replace("{user}", member.mention).replace("{server}", member.guild.name).replace("{member_count}", str(member.guild.member_count))

        # --- 1. POST TO CONFIG TEXT CHANNEL ---
        channel_id = settings.get("channel_id")
        if channel_id:
            channel = member.guild.get_channel(int(channel_id))
            if channel:
                embed = discord.Embed(
                    title="✨ New Connection Established",
                    description=formatted_msg,
                    color=0x9b59b6,
                    timestamp=datetime.datetime.now(datetime.timezone.utc)
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                embed.add_field(name="Account Age Identity", value=member.created_at.strftime("%B %d, %Y"), inline=True)
                embed.add_field(name="Guild Member Count", value=f"`{member.guild.member_count}` Total", inline=True)
                embed.set_footer(text=f"User ID: {member.id}")
                
                banner_url = settings.get("banner_url")
                if banner_url:
                    embed.set_image(url=banner_url)
                
                try:
                    await channel.send(embed=embed)
                except discord.Forbidden:
                    pass

                # --- DISPATCH SECOND MESSAGE IF CONFIGURED ---
                if settings.get("second_message_enabled", False) and settings.get("second_message"):
                    raw_second = settings["second_message"]
                    formatted_second = raw_second.replace("{user}", member.mention).replace("{server}", member.guild.name).replace("{member_count}", str(member.guild.member_count))
                    try:
                        if settings.get("second_message_as_embed", False):
                            sec_embed = discord.Embed(description=formatted_second, color=0xffd700)
                            await channel.send(embed=sec_embed)
                        else:
                            await channel.send(formatted_second)
                    except Exception:
                        pass

        # --- 2. DM WELCOME SYSTEM ---
        if settings.get("send_dm", False):
            try:
                dm_embed = discord.Embed(
                    title=f"✨ Welcome to {member.guild.name}!",
                    description=formatted_msg,
                    color=0x9b59b6,
                    timestamp=datetime.datetime.now(datetime.timezone.utc)
                )
                dm_embed.set_thumbnail(url=member.guild.icon.url if member.guild.icon else member.display_avatar.url)
                dm_embed.set_footer(text=f"Onboarding Portal • {member.guild.name}")
                
                banner_url = settings.get("banner_url")
                if banner_url:
                    dm_embed.set_image(url=banner_url)

                await member.send(embed=dm_embed)
            except discord.Forbidden:
                pass
            except Exception as e:
                print(f"⚠️ Welcome Cog: DM trigger failed: {e}")

async def setup(bot: commands.Bot):
    await bot.add_cog(Welcome(bot))
