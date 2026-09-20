import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let cachedGuilds = null;
let lastFetchTime = 0;

export const getRealBotGuilds = async () => {
  const now = Date.now();
  if (cachedGuilds && (now - lastFetchTime < 60000)) {
    return cachedGuilds;
  }

  const token = config.discordToken || process.env.DISCORD_TOKEN;
  if (!token || token.includes('your_discord_bot_token')) {
    return [];
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bot ${token}`
      }
    });

    if (!response.ok) {
      logger.warn(`Discord API @me/guilds response status: ${response.status}`);
      return cachedGuilds || [];
    }

    const guilds = await response.json();
    cachedGuilds = guilds.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.icon 
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith('a_') ? 'gif' : 'png'}`
        : 'https://cdn-icons-png.flaticon.com/512/2913/2913990.png',
      owner: g.owner,
      permissions: g.permissions
    }));

    lastFetchTime = now;
    logger.info(`Fetched ${cachedGuilds.length} real connected bot guilds from Discord REST API`);
    return cachedGuilds;
  } catch (err) {
    logger.warn(`Failed to fetch real bot guilds from Discord REST API: ${err.message}`);
    return cachedGuilds || [];
  }
};
