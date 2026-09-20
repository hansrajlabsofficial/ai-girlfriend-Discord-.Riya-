import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getDb } from '../connect.js';
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
