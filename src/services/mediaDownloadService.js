import axios from 'axios';
import btch from 'btch-downloader';
import { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

const DISCORD_MAX_FILE_BYTES = 24 * 1024 * 1024; // 24MB safety limit (under 25MB cap)
const BRAND_FOOTER = '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.';
const EMBLEM_ICON = 'https://cdn.discordapp.com/attachments/1450771986031706214/1560613901396086904/Global_Fishing_Emblem_1.png?ex=6ad35a74&is=6ad208f4&hm=c0756eb02f2652d908a466b51026a18c45165dcdd6aad2abf5645b29728cf52c&';

// Platform regex patterns
export const REGEX_PATTERNS = {
  instagram: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|tv|stories|share)\/([A-Za-z0-9_-]+)/i,
  tiktok: /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:@[\w.-]+\/video\/\d+|[\w.-]+)/i,
  youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
};

/**
 * Detect the platform from URL
 */
export const detectPlatform = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (REGEX_PATTERNS.tiktok.test(url)) return 'tiktok';
  if (REGEX_PATTERNS.instagram.test(url)) return 'instagram';
  if (REGEX_PATTERNS.youtube.test(url)) return 'youtube';
  return null;
};

/**
 * Extract social media URLs from message text
 */
export const extractUrlsFromText = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  return matches.filter(url => detectPlatform(url) !== null);
};

/**
 * Download a remote URL into a Buffer with size limit checking
 */
export const downloadBuffer = async (mediaUrl, maxBytes = DISCORD_MAX_FILE_BYTES) => {
  try {
    const headRes = await axios.head(mediaUrl, {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }).catch(() => null);

    const contentLength = headRes?.headers?.['content-length'] ? parseInt(headRes.headers['content-length'], 10) : 0;
    if (contentLength > maxBytes) {
      return { buffer: null, tooLarge: true, sizeBytes: contentLength, mediaUrl };
    }

    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: maxBytes,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const buffer = Buffer.from(response.data);
    return {
      buffer,
      tooLarge: buffer.length > maxBytes,
      sizeBytes: buffer.length,
      mediaUrl
    };
  } catch (error) {
    logger.debug(`Buffer download failed for ${mediaUrl}: ${error.message}`);
    return { buffer: null, tooLarge: false, sizeBytes: 0, mediaUrl, error: error.message };
  }
};

/**
 * Extract YouTube media details
 */
export const fetchYouTube = async (url, preferredType = 'video') => {
  const match = url.match(REGEX_PATTERNS.youtube);
  const videoId = match ? match[1] : null;
  const maxresThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  const hqThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  if (preferredType === 'image') {
    // Return maxres thumbnail
    const thumbUrl = maxresThumbnail || hqThumbnail;
    const download = await downloadBuffer(thumbUrl);
    return {
      success: true,
      platform: 'youtube',
      type: 'image',
      title: `YouTube Thumbnail [${videoId}]`,
      mediaUrl: thumbUrl,
      thumbnailUrl: thumbUrl,
      buffer: download.buffer,
      sizeBytes: download.sizeBytes,
      filename: `youtube_${videoId || 'image'}.jpg`
    };
  }

  // Preferred Video
  try {
    const res = await btch.youtube(url);
    if (res && res.status && res.mp4) {
      const videoUrl = typeof res.mp4 === 'string' ? res.mp4 : res.mp4[0];
      const download = await downloadBuffer(videoUrl);
      return {
        success: true,
        platform: 'youtube',
        type: 'video',
        title: res.title || `YouTube Video [${videoId}]`,
        mediaUrl: videoUrl,
        thumbnailUrl: res.thumbnail || maxresThumbnail || hqThumbnail,
        buffer: download.buffer,
        tooLarge: download.tooLarge,
        sizeBytes: download.sizeBytes,
        filename: `youtube_${videoId || Date.now()}.mp4`
      };
    }
  } catch (err) {
    logger.warn(`btch.youtube failed: ${err.message}`);
  }

  // Fallback: Return metadata and direct watch link
  return {
    success: true,
    platform: 'youtube',
    type: preferredType || 'video',
    title: `YouTube Video [${videoId}]`,
    mediaUrl: url,
    thumbnailUrl: maxresThumbnail || hqThumbnail,
    buffer: null,
    tooLarge: true,
    filename: `youtube_${videoId || Date.now()}.mp4`
  };
};

/**
 * Extract TikTok media details
 */
export const fetchTikTok = async (url, preferredType = 'video') => {
  try {
    const res = await btch.ttdl(url);
    if (res && res.status) {
      const videoUrl = Array.isArray(res.video) ? res.video[0] : res.video;
      const thumbnailUrl = res.thumbnail;
      const title = res.title || 'TikTok Media';

      if (preferredType === 'image') {
        const targetUrl = thumbnailUrl || videoUrl;
        const download = targetUrl ? await downloadBuffer(targetUrl) : { buffer: null };
        return {
          success: true,
          platform: 'tiktok',
          type: 'image',
          title,
          mediaUrl: targetUrl,
          thumbnailUrl,
          buffer: download.buffer,
          sizeBytes: download.sizeBytes,
          filename: `tiktok_${Date.now()}.jpg`
        };
      }

      // Default: Video
      if (videoUrl) {
        const download = await downloadBuffer(videoUrl);
        return {
          success: true,
          platform: 'tiktok',
          type: 'video',
          title,
          mediaUrl: videoUrl,
          thumbnailUrl,
          buffer: download.buffer,
          tooLarge: download.tooLarge,
          sizeBytes: download.sizeBytes,
          filename: `tiktok_${Date.now()}.mp4`
        };
      }
    }
  } catch (err) {
    logger.warn(`btch.ttdl error: ${err.message}`);
  }

  // Secondary fallback: TikWM direct API
  try {
    const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      timeout: 10000
    });
    if (tikwmRes.data && tikwmRes.data.code === 0 && tikwmRes.data.data) {
      const data = tikwmRes.data.data;
      const title = data.title || 'TikTok Media';
      const thumbnailUrl = data.cover;

      if (preferredType === 'image' && data.images && data.images.length > 0) {
        const imgUrl = data.images[0];
        const download = await downloadBuffer(imgUrl);
        return {
          success: true,
          platform: 'tiktok',
          type: 'image',
          title,
          mediaUrl: imgUrl,
          thumbnailUrl: data.cover,
          buffer: download.buffer,
          sizeBytes: download.sizeBytes,
          filename: `tiktok_${Date.now()}.jpg`
        };
      }

      const videoUrl = data.play || data.wmplay;
      const download = videoUrl ? await downloadBuffer(videoUrl) : { buffer: null };
      return {
        success: true,
        platform: 'tiktok',
        type: 'video',
        title,
        mediaUrl: videoUrl || url,
        thumbnailUrl: data.cover,
        buffer: download.buffer,
        tooLarge: download.tooLarge,
        sizeBytes: download.sizeBytes,
        filename: `tiktok_${Date.now()}.mp4`
      };
    }
  } catch (err) {
    logger.warn(`TikWM fallback failed: ${err.message}`);
  }

  return {
    success: false,
    platform: 'tiktok',
    error: 'Could not fetch TikTok media.'
  };
};

/**
 * Extract Instagram media details
 */
export const fetchInstagram = async (url, preferredType = 'video') => {
  const match = url.match(REGEX_PATTERNS.instagram);
  const shortcode = match ? match[1] : null;

  // Clean the URL of tracker query params
  const cleanUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/` : url;
  const ogProxyUrl = shortcode ? `https://oginstagram.com/p/${shortcode}/` : url;
  const directProxyUrl = shortcode ? `https://d.oginstagram.com/p/${shortcode}/` : url;

  // 1. Try btch.igdl
  try {
    const res = await btch.igdl(cleanUrl);
    if (res && res.status && Array.isArray(res.result) && res.result.length > 0) {
      const valid = res.result.find(item => item.url && item.url.length > 10);
      if (valid) {
        const isVideo = valid.url.includes('.mp4') || preferredType === 'video';
        const download = await downloadBuffer(valid.url);
        return {
          success: true,
          platform: 'instagram',
          type: isVideo ? 'video' : 'image',
          title: `Instagram Post [${shortcode || 'Media'}]`,
          mediaUrl: valid.url,
          thumbnailUrl: valid.thumbnail || null,
          buffer: download.buffer,
          tooLarge: download.tooLarge,
          sizeBytes: download.sizeBytes,
          filename: `instagram_${shortcode || Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
        };
      }
    }
  } catch (err) {
    logger.debug(`btch.igdl failed: ${err.message}`);
  }

  // 2. Try direct proxy buffer download
  if (directProxyUrl) {
    try {
      const download = await downloadBuffer(directProxyUrl);
      if (download.buffer) {
        const isVideo = preferredType === 'video';
        return {
          success: true,
          platform: 'instagram',
          type: preferredType || 'video',
          title: `Instagram Media [${shortcode || 'Post'}]`,
          mediaUrl: directProxyUrl,
          thumbnailUrl: null,
          buffer: download.buffer,
          tooLarge: download.tooLarge,
          sizeBytes: download.sizeBytes,
          filename: `instagram_${shortcode || Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
        };
      }
    } catch (e) {
      logger.debug(`directProxyUrl download failed: ${e.message}`);
    }
  }

  // 3. Fallback: Return rich embed link proxy that Discord and users can play directly!
  return {
    success: true,
    platform: 'instagram',
    type: preferredType || 'video',
    title: `Instagram Media [${shortcode || 'Post'}]`,
    mediaUrl: ogProxyUrl,
    directDownloadUrl: directProxyUrl,
    thumbnailUrl: null,
    buffer: null,
    tooLarge: true,
    filename: `instagram_${shortcode || Date.now()}.mp4`
  };
};

/**
 * Universal media extraction orchestrator
 */
export const downloadMedia = async ({ url, platform, type = 'video' }) => {
  const targetPlatform = platform || detectPlatform(url);
  if (!targetPlatform) {
    return {
      success: false,
      error: 'Unsupported or unrecognised URL. Please provide a valid Instagram, YouTube, or TikTok link!'
    };
  }

  if (targetPlatform === 'tiktok') {
    return await fetchTikTok(url, type);
  }
  if (targetPlatform === 'youtube') {
    return await fetchYouTube(url, type);
  }
  if (targetPlatform === 'instagram') {
    return await fetchInstagram(url, type);
  }

  return { success: false, error: 'Unknown platform.' };
};

/**
 * Builds rich embed and action row for downloaded media
 */
export const buildMediaResponse = (result, originalUrl, requestedBy) => {
  const platformNames = {
    instagram: 'Instagram 📸',
    youtube: 'YouTube 🎥',
    tiktok: 'TikTok 🎵'
  };

  const platformColors = {
    instagram: 0xE1306C,
    youtube: 0xFF0000,
    tiktok: 0x00F2FE
  };

  const embed = new EmbedBuilder()
    .setTitle(`📥 Downloaded: ${result.title || 'Social Media Content'}`)
    .setColor(platformColors[result.platform] || 0xFF69B4)
    .addFields(
      { name: '🌐 Platform', value: platformNames[result.platform] || result.platform, inline: true },
      { name: '📁 Media Type', value: result.type === 'image' ? 'Image 🖼️' : 'Video 🎬', inline: true }
    )
    .setFooter({ text: BRAND_FOOTER, iconURL: EMBLEM_ICON })
    .setTimestamp();

  if (result.sizeBytes) {
    const mb = (result.sizeBytes / (1024 * 1024)).toFixed(2);
    embed.addFields({ name: '📦 File Size', value: `${mb} MB`, inline: true });
  }

  if (result.thumbnailUrl) {
    embed.setThumbnail(result.thumbnailUrl);
  }

  if (requestedBy) {
    embed.setAuthor({
      name: `Downloaded by ${requestedBy.tag || requestedBy.username}`,
      iconURL: requestedBy.displayAvatarURL?.()
    });
  }

  const buttons = [];
  const directLink = result.directDownloadUrl || result.mediaUrl;
  if (directLink && directLink.startsWith('http')) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('📥 Direct Media Link')
        .setStyle(ButtonStyle.Link)
        .setURL(directLink)
    );
  }

  if (originalUrl && originalUrl.startsWith('http')) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('🔗 Original Post')
        .setStyle(ButtonStyle.Link)
        .setURL(originalUrl)
    );
  }

  const row = buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;

  return { embed, row };
};

export const PLATFORM_ASSETS = {
  instagram: {
    username: 'INSTAGRAM DOWNLOAD LINK',
    avatarURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png',
    color: '#E1306C'
  },
  tiktok: {
    username: 'TIKTOK DOWNLOAD LINK',
    avatarURL: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
    color: '#00F2FE'
  },
  youtube: {
    username: 'YOUTUBE DOWNLOAD LINK',
    avatarURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png',
    color: '#FF0000'
  }
};

/**
 * Handles incoming messages in the auto-download channel
 */
export const handleAutoDownloadMessage = async (message) => {
  if (!message.guild || message.author.bot) return false;

  const guildConfig = await getGuildConfig(message.guild.id);
  if (!guildConfig.autoDownloadChannelId || guildConfig.autoDownloadChannelId !== message.channel.id) {
    return false;
  }

  if (guildConfig.autoDownloadEnabled === false) {
    return false;
  }

  const urls = extractUrlsFromText(message.content);
  if (urls.length === 0) return false;

  // Process the first media URL
  const targetUrl = urls[0];
  const platform = detectPlatform(targetUrl);
  if (!platform) return false;

  // Suppress original embeds to prevent double clutter in chat
  await message.suppressEmbeds(true).catch(() => {});

  // Send typing indicator
  await message.channel.sendTyping().catch(() => {});

  try {
    const result = await downloadMedia({ url: targetUrl, platform, type: 'video' });
    if (!result.success) {
      logger.debug(`Auto-download failed for ${targetUrl}: ${result.error}`);
      return false;
    }

    const pInfo = PLATFORM_ASSETS[platform] || {
      username: 'MEDIA DOWNLOAD LINK',
      avatarURL: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      color: '#00E5FF'
    };

    const buttons = [];
    if (targetUrl && targetUrl.startsWith('http')) {
      buttons.push(
        new ButtonBuilder()
          .setLabel('🔗 Original Post')
          .setStyle(ButtonStyle.Link)
          .setURL(targetUrl)
      );
    }
    const directLink = result.directDownloadUrl || result.mediaUrl;
    if (directLink && directLink.startsWith('http')) {
      buttons.push(
        new ButtonBuilder()
          .setLabel('📥 Direct Media Link')
          .setStyle(ButtonStyle.Link)
          .setURL(directLink)
      );
    }
    const row = buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons.slice(0, 5)) : null;

    const contentText = `👤 **Requested by:** <@${message.author.id}>`;
    const components = row ? [row] : [];
    const files = [];

    if (result.buffer && !result.tooLarge) {
      const ext = result.type === 'image' ? 'jpg' : 'mp4';
      files.push(new AttachmentBuilder(result.buffer, {
        name: result.filename || `${platform}_${Date.now()}.${ext}`
      }));
    }

    // Try sending via Webhook so it matches user reference screenshot (Avatar: Instagram, Name: INSTAGRAM DOWNLOAD LINK)
    let postedViaWebhook = false;
    const botMember = message.guild.members.me || await message.guild.members.fetchMe().catch(() => null);
    if (botMember && message.channel.permissionsFor(botMember)?.has('ManageWebhooks')) {
      try {
        const webhooks = await message.channel.fetchWebhooks().catch(() => null);
        let webhook = webhooks?.find(wh => wh.name.includes('DOWNLOAD LINK') || wh.owner?.id === message.client.user.id);
        if (!webhook) {
          webhook = await message.channel.createWebhook({
            name: 'MEDIA DOWNLOAD LINK',
            avatar: pInfo.avatarURL
          }).catch(() => null);
        }

        if (webhook) {
          const payload = {
            username: pInfo.username,
            avatarURL: pInfo.avatarURL,
            content: contentText,
            components
          };
          if (files.length > 0) payload.files = files;
          else if (directLink) payload.content = `${contentText}\n${directLink}`;

          await webhook.send(payload);
          postedViaWebhook = true;

          // Delete user original raw link message for clean clutter-free channel
          if (message.deletable) {
            await message.delete().catch(() => {});
          }
        }
      } catch (whErr) {
        logger.debug(`Webhook dispatch failed: ${whErr.message}`);
      }
    }

    // Fallback: Send directly as bot reply
    if (!postedViaWebhook) {
      const payload = {
        content: contentText,
        components
      };
      if (files.length > 0) {
        payload.files = files;
      } else {
        const { embed } = buildMediaResponse(result, targetUrl, message.author);
        payload.embeds = [embed];
      }

      await message.reply(payload);
      await message.react('✅').catch(() => {});
    }

    return true;
  } catch (err) {
    logger.error(`Error in handleAutoDownloadMessage: ${err.message}`);
    return false;
  }
};
