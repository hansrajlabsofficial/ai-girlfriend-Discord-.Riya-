import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getDb, getAdminDb } from '../connect.js';
import { logger } from '../../utils/logger.js';

// In-memory fallback
const memoryFallbackGuilds = new Map();

export const getAllGlobalChatChannels = async () => {
  const channelsMap = new Map();

  // 1. Check memory fallback
  for (const [gId, conf] of memoryFallbackGuilds.entries()) {
    if (conf.globalChatChannelId) {
      channelsMap.set(gId, conf.globalChatChannelId);
    }
  }

  // 2. Check Firestore DB
  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'guilds'));
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.guildId && data.globalChatChannelId) {
          channelsMap.set(data.guildId, data.globalChatChannelId);
        }
      });
    } catch (err) {
      logger.warn(`Failed to fetch global chat channels from Firestore: ${err.message}`);
    }
  }

  return Array.from(channelsMap.entries()).map(([guildId, channelId]) => ({ guildId, channelId }));
};

export const getAll247StatusChannels = async () => {
  const statusMap = new Map();

  for (const [gId, conf] of memoryFallbackGuilds.entries()) {
    if (conf.status247Enabled && conf.statusChannelId) {
      statusMap.set(gId, { guildId: gId, channelId: conf.statusChannelId, messageId: conf.statusMessageId });
    }
  }

  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'guilds'));
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.guildId && data.status247Enabled && data.statusChannelId) {
          statusMap.set(data.guildId, { guildId: data.guildId, channelId: data.statusChannelId, messageId: data.statusMessageId });
        }
      });
    } catch (err) {
      logger.warn(`Failed to fetch 24/7 status channels from Firestore: ${err.message}`);
    }
  }

  return Array.from(statusMap.values());
};

export const getGuildConfig = async (guildId) => {
  const db = getDb();

  if (db) {
    try {
      const guildRef = doc(db, 'guilds', guildId);
      const guildSnap = await getDoc(guildRef);

      if (guildSnap.exists()) {
        const data = guildSnap.data();
        data._guildId = guildId;
        data.boundChannelId = data.boundChannelId || null;
        data.globalChatChannelId = data.globalChatChannelId || null;
        data.emojiquizChannelId = data.emojiquizChannelId || null;
        data.antonymquizChannelId = data.antonymquizChannelId || null;
        data.countingChannelId = data.countingChannelId || null;
        data.statusChannelId = data.statusChannelId || null;
        data.statusMessageId = data.statusMessageId || null;
        data.status247Enabled = data.status247Enabled || false;
        data.currentCountingNumber = data.currentCountingNumber || 0;
        data.lastCountingUserId = data.lastCountingUserId || null;
        data.language = data.language || 'en';
        data.save = async function () {
          return await saveGuildConfig(this);
        };
        return data;
      } else {
        const newConfig = {
          _guildId: guildId,
          guildId,
          boundChannelId: null,
          emojiquizChannelId: null,
          antonymquizChannelId: null,
          countingChannelId: null,
          statusChannelId: null,
          statusMessageId: null,
          status247Enabled: false,
          currentCountingNumber: 0,
          lastCountingUserId: null,
          language: 'en',
          updatedAt: new Date().toISOString()
        };
        newConfig.save = async function () {
          return await saveGuildConfig(this);
        };
        await saveGuildConfig(newConfig);
        return newConfig;
      }
    } catch (err) {
      logger.warn(`Firestore read failed for guild ${guildId}: ${err.message}`);
    }
  }

  if (!memoryFallbackGuilds.has(guildId)) {
    memoryFallbackGuilds.set(guildId, {
      _guildId: guildId,
      guildId,
      boundChannelId: null,
      emojiquizChannelId: null,
      antonymquizChannelId: null,
      countingChannelId: null,
      currentCountingNumber: 0,
      lastCountingUserId: null,
      language: 'en',
      save: async function () { return this; }
    });
  }
  const config = memoryFallbackGuilds.get(guildId);
  if (config.currentCountingNumber === undefined) config.currentCountingNumber = 0;
  if (config.language === undefined) config.language = 'en';
  return config;
};

export const saveGuildConfig = async (guildConfig) => {
  if (!guildConfig.guildId) return guildConfig;

  const admin = getAdminDb();
  if (admin) {
    try {
      const dataToSave = { ...guildConfig };
      delete dataToSave._guildId;
      delete dataToSave.save;
      dataToSave.updatedAt = new Date().toISOString();

      await admin.collection('guilds').doc(guildConfig.guildId).set(dataToSave, { merge: true });
      return guildConfig;
    } catch (err) {
      logger.warn(`Admin SDK save failed for guild ${guildConfig.guildId}: ${err.message}`);
    }
  }

  const db = getDb();
  if (db) {
    try {
      const guildRef = doc(db, 'guilds', guildConfig.guildId);
      const dataToSave = { ...guildConfig };
      delete dataToSave._guildId;
      delete dataToSave.save;
      dataToSave.updatedAt = new Date().toISOString();

      await setDoc(guildRef, dataToSave, { merge: true });
    } catch (err) {
      logger.warn(`Firestore save failed for guild ${guildConfig.guildId}: ${err.message}`);
    }
  }
  return guildConfig;
};

export const setBoundChannel = async (guildId, channelId) => {
  const guildConfig = await getGuildConfig(guildId);
  guildConfig.boundChannelId = channelId;
  await saveGuildConfig(guildConfig);
  return guildConfig;
};
