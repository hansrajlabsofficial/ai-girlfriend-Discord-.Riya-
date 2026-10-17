import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { downloadMedia, buildMediaResponse, detectPlatform, REACTION_EMOJIS } from '../services/mediaDownloadService.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('download')
  .setDescription('Download videos or images from Instagram, YouTube, or TikTok')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Select media type (Video or Image)')
      .setRequired(true)
      .addChoices(
        { name: 'Video 🎬', value: 'video' },
        { name: 'Image 🖼️', value: 'image' }
      )
  )
  .addStringOption(option =>
    option
      .setName('platform')
      .setDescription('Select the social media platform')
      .setRequired(true)
      .addChoices(
        { name: 'Instagram 📸', value: 'instagram' },
        { name: 'YouTube 🎥', value: 'youtube' },
        { name: 'TikTok 🎵', value: 'tiktok' }
      )
  )
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('Enter the link to download')
      .setRequired(true)
  );

export const execute = async (interaction) => {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply().catch(() => {});
  }

  const type = interaction.options.getString('type');
  let platform = interaction.options.getString('platform');
  const url = interaction.options.getString('url')?.trim();

  if (!url || !url.startsWith('http')) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('❌ Invalid URL')
      .setDescription('Arey baka, please provide a valid HTTP or HTTPS media link! 🥺\nExample: `https://www.instagram.com/reel/...` or `https://youtube.com/shorts/...`')
      .setFooter({ text: '© 2026 | Developed by HL.Hansraj Labs | All Rights Reserved.' });
    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  // Auto-detect if user selected mismatched platform
  const detected = detectPlatform(url);
  if (detected && detected !== platform) {
    platform = detected;
  }

  try {
    const result = await downloadMedia({ url, platform, type });

    if (!result.success) {
      const failEmbed = new EmbedBuilder()
        .setColor('#FF3366')
        .setTitle('⚠️ Media Download Notice')
        .setDescription(
          `Arey baka! Couldn't extract the ${type} from this link directly: ${result.error || 'Server error or private media.'}\n\n` +
          `• Make sure the post or account is **public**.\n` +
          `• Check if the URL is correct and not expired.`
        )
        .setFooter({ text: '© 2026 | Developed by HL.Hansraj Labs | All Rights Reserved.' });
      return await interaction.editReply({ embeds: [failEmbed] });
    }

    const { embed, row } = buildMediaResponse(result, url, interaction.user);
    const replyOptions = {
      content: `👤 **Requested by:** <@${interaction.user.id}>`
    };
    if (row) replyOptions.components = [row];

    if (result.buffer && !result.tooLarge) {
      const extension = result.type === 'image' ? 'jpg' : 'mp4';
      const fileAttachment = new AttachmentBuilder(result.buffer, {
        name: result.filename || `download_${Date.now()}.${extension}`
      });
      replyOptions.files = [fileAttachment];
    } else {
      replyOptions.embeds = [embed];
    }

    await interaction.editReply(replyOptions);

    // Auto-react with all 30 emojis sequentially
    const replyMsg = await interaction.fetchReply().catch(() => null);
    if (replyMsg) {
      for (const emoji of REACTION_EMOJIS) {
        try {
          await replyMsg.react(emoji);
          await new Promise(r => setTimeout(r, 250));
        } catch (e) {
          logger.debug(`Reaction failed ${emoji}: ${e.message}`);
        }
      }
    }
  } catch (err) {
    logger.error(`Error in /download execution: ${err.message}`);
    const errEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Download Failed')
      .setDescription('Arey thodi technical issue aavi gayi baka! Please try again in a few moments.')
      .setFooter({ text: '© 2026 | Developed by HL.Hansraj Labs | All Rights Reserved.' });
    await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
  }
};
