import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getDb, getAdminDb } from '../connect.js';
import { logger } from '../../utils/logger.js';

// In-memory fallback storage if Firestore is unavailable
const memoryFallbackUsers = new Map();

const getFallbackKey = (userId, guildId) => `${guildId}:${userId}`;

export const getGlobalTopBankUsers = async (topLimit = 10) => {
  const usersMap = new Map();

  // 1. Gather from memory fallback
  for (const user of memoryFallbackUsers.values()) {
    const total = (user.balance !== undefined ? user.balance : 10000) + (user.bank || 0);
    const existing = usersMap.get(user.userId);
    if (!existing || total > existing.total) {
      usersMap.set(user.userId, { ...user, total });
    }
  }

  // 2. Gather from Firestore if connected
  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach(docSnap => {
        const u = docSnap.data();
        if (u.userId) {
          const total = (u.balance !== undefined ? u.balance : 10000) + (u.bank || 0);
          const existing = usersMap.get(u.userId);
          if (!existing || total > existing.total) {
            usersMap.set(u.userId, { ...u, total });
          }
        }
      });
    } catch (err) {
      logger.warn(`Firestore getDocs failed for top bank users: ${err.message}`);
    }
  }

  const sorted = Array.from(usersMap.values()).sort((a, b) => b.total - a.total);
  return sorted.slice(0, topLimit);
};

export const getAggregatedUserData = async (userId) => {
  if (!userId) return null;
  let highestUser = null;
  let maxScore = -1;

  // 1. Search memory fallback
  for (const [key, user] of memoryFallbackUsers.entries()) {
    if (user.userId === userId || key.endsWith(`:${userId}`)) {
      const bank = user.bank || 0;
      const balance = user.balance !== undefined ? user.balance : 10000;
      const score = bank + balance + ((user.level || 1) * 100000) + (user.xp || 0);
      if (score > maxScore) {
        maxScore = score;
        highestUser = user;
      }
    }
  }

  // 2. Search Firestore
  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach(docSnap => {
        const u = docSnap.data();
        if (u.userId === userId || docSnap.id.endsWith(`_${userId}`)) {
          const bank = u.bank || 0;
          const balance = u.balance !== undefined ? u.balance : 10000;
          const score = bank + balance + ((u.level || 1) * 100000) + (u.xp || 0);
          if (score > maxScore) {
            maxScore = score;
            highestUser = u;
          }
        }
      });
    } catch (err) {
      logger.warn(`Firestore getDocs failed for aggregated user ${userId}: ${err.message}`);
    }
  }

  if (highestUser) {
    highestUser.balance = highestUser.balance !== undefined ? highestUser.balance : 10000;
    highestUser.bank = highestUser.bank !== undefined ? highestUser.bank : 0;
    highestUser.level = highestUser.level || 1;
    highestUser.xp = highestUser.xp || 0;
    return highestUser;
  }

  return await getUserData(userId, 'global');
};

export const getUserData = async (userId, guildId) => {
  const db = getDb();
  const docId = `${guildId}_${userId}`;

  if (db) {
    try {
      const userRef = doc(db, 'users', docId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        data._docId = docId;
        data.balance = data.balance !== undefined ? data.balance : 10000;
        data.bank = data.bank !== undefined ? data.bank : 0;
        data.hp = data.hp !== undefined ? data.hp : 100;
        data.maxHp = data.maxHp !== undefined ? data.maxHp : 100;
        data.attributes = data.attributes || { strength: 1, defense: 1, agility: 1, luck: 1 };
        data.cooldowns = data.cooldowns || {};
        data.inventory = data.inventory || [];
        data.friends = data.friends || {};
        data.friendRequests = data.friendRequests || [];
        data.partnerId = data.partnerId || null;
        data.gangId = data.gangId || null;
        data.save = async function () {
          return await saveUserData(this);
        };
        return data;
      } else {
        const newUser = {
          _docId: docId,
          userId,
          guildId,
          xp: 0,
          level: 1,
          balance: 10000,
          bank: 0,
          hp: 100,
          maxHp: 100,
          attributes: { strength: 1, defense: 1, agility: 1, luck: 1 },
          cooldowns: {},
          inventory: [],
          friends: {},
          friendRequests: [],
          partnerId: null,
          gangId: null,
          moodScore: 50,
          moodState: 'NEUTRAL',
          memories: [],
          conversationHistory: [],
          lastDailyQuiz: null,
          lastDailyTask: null,
          currentDailyTask: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newUser.save = async function () {
          return await saveUserData(this);
        };
        await saveUserData(newUser);
        return newUser;
      }
    } catch (err) {
      logger.warn(`Firestore read failed for user ${docId}. Using in-memory fallback: ${err.message}`);
    }
  }

  // Fallback to in-memory store
  const key = getFallbackKey(userId, guildId);
  if (!memoryFallbackUsers.has(key)) {
    memoryFallbackUsers.set(key, {
      _docId: docId,
      userId,
      guildId,
      xp: 0,
      level: 1,
      balance: 10000,
      bank: 0,
      hp: 100,
      maxHp: 100,
      attributes: { strength: 1, defense: 1, agility: 1, luck: 1 },
      cooldowns: {},
      inventory: [],
      friends: {},
      friendRequests: [],
      partnerId: null,
      gangId: null,
      moodScore: 50,
      moodState: 'NEUTRAL',
      memories: [],
      conversationHistory: [],
      lastDailyQuiz: null,
      lastDailyTask: null,
      currentDailyTask: null,
      save: async function () { return this; }
    });
  }
  const user = memoryFallbackUsers.get(key);
  if (user.balance === undefined) user.balance = 10000;
  if (user.bank === undefined) user.bank = 0;
  if (user.hp === undefined) user.hp = 100;
  if (user.maxHp === undefined) user.maxHp = 100;
  if (!user.attributes) user.attributes = { strength: 1, defense: 1, agility: 1, luck: 1 };
  if (!user.cooldowns) user.cooldowns = {};
  if (!user.inventory) user.inventory = [];
  if (!user.friends) user.friends = {};
  if (!user.friendRequests) user.friendRequests = [];
  if (user.partnerId === undefined) user.partnerId = null;
  if (user.gangId === undefined) user.gangId = null;
  return user;
};

export const saveUserData = async (userData) => {
  const db = getDb();

  if (db && userData._docId) {
    try {
      const userRef = doc(db, 'users', userData._docId);
      const dataToSave = { ...userData };
      delete dataToSave._docId;
      delete dataToSave.save;
      dataToSave.updatedAt = new Date().toISOString();

      await setDoc(userRef, dataToSave, { merge: true });
      return userData;
    } catch (err) {
      logger.warn(`Firestore save failed for user ${userData._docId}: ${err.message}`);
    }
  }
  return userData;
};

export const saveUserSessionData = async ({ userId, username, displayName, avatar, banner, accentColor, accessToken, connectedServerCount, adminServerCount }) => {
  const db = getDb();
  if (!userId) return null;

  const docId = `session_${userId}`;
  const aggregated = await getAggregatedUserData(userId);

  const sessionData = {
    userId,
    username: username || aggregated?.username || 'Unknown',
    displayName: displayName || username || aggregated?.displayName || 'Member',
    avatar: avatar || null,
    banner: banner || null,
    accentColor: accentColor || null,
    accessToken: accessToken || null,
    connectedServerCount: connectedServerCount || 0,
    adminServerCount: adminServerCount || 0,
    bank: aggregated?.bank || 0,
    balance: aggregated?.balance !== undefined ? aggregated.balance : 10000,
    level: aggregated?.level || 1,
    xp: aggregated?.xp || 0,
    isDailyPartner: aggregated?.isDailyPartner || false,
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const admin = getAdminDb();
  if (admin) {
    try {
      await admin.collection('user_sessions').doc(docId).set(sessionData, { merge: true });
      await admin.collection('users').doc(`global_${userId}`).set({
        userId,
        username: sessionData.username,
        displayName: sessionData.displayName,
        avatar: sessionData.avatar,
        banner: sessionData.banner,
        bank: sessionData.bank,
        balance: sessionData.balance,
        level: sessionData.level,
        xp: sessionData.xp,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      logger.info(`Persisted user session & economy in Firestore via Admin SDK for user ${userId}`);
      return sessionData;
    } catch (err) {
      logger.warn(`Admin SDK save user_sessions failed for user ${userId}: ${err.message}`);
    }
  }

  if (db) {
    try {
      const sessionRef = doc(db, 'user_sessions', docId);
      await setDoc(sessionRef, sessionData, { merge: true });

      const globalUserRef = doc(db, 'users', `global_${userId}`);
      await setDoc(globalUserRef, {
        userId,
        username: sessionData.username,
        displayName: sessionData.displayName,
        avatar: sessionData.avatar,
        banner: sessionData.banner,
        bank: sessionData.bank,
        balance: sessionData.balance,
        level: sessionData.level,
        xp: sessionData.xp,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      logger.info(`Persisted user session & economy in Firestore for user ${userId} (${connectedServerCount} connected servers)`);
    } catch (err) {
      logger.warn(`Firestore save user_sessions failed for user ${userId}: ${err.message}`);
    }
  }
  return sessionData;
};

const globalMessageLocks = new Set();
const lockTimestamps = new Map();

export const claimMessageLock = async (messageId) => {
  if (!messageId) return true;

  if (globalMessageLocks.has(messageId)) {
    return false;
  }
  globalMessageLocks.add(messageId);
  lockTimestamps.set(messageId, Date.now());

  if (globalMessageLocks.size > 1000) {
    const first = globalMessageLocks.values().next().value;
    globalMessageLocks.delete(first);
    lockTimestamps.delete(first);
  }

  const db = getDb();
  if (db) {
    try {
      const lockRef = doc(db, 'message_locks', messageId);
      const lockSnap = await getDoc(lockRef);

      if (lockSnap.exists()) {
        const data = lockSnap.data();
        const lockAge = Date.now() - (data.timestamp ? new Date(data.timestamp).getTime() : 0);
        if (lockAge < 15000) {
          return false;
        }
      }

      await setDoc(lockRef, {
        claimedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        pid: process.pid || 'node'
      });
      return true;
    } catch (err) {
      return true;
    }
  }

  return true;
};
