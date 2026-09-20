import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let db = null;
let isConnected = false;

export const initializeAutoCollections = async () => {
  const db = getDb();
  if (!db) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const sysRef = doc(db, 'system', 'status');
    await setDoc(sysRef, {
      status: 'online',
      botName: 'Riya AI Girlfriend',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const ownerId = '1016322069093';
    const ownerRef = doc(db, 'users', `global_${ownerId}`);
    await setDoc(ownerRef, {
      userId: ownerId,
      username: 'HANSRAJxFPS',
      displayName: 'A S 友 H A N S R A J 🍃',
      balance: 0,
      bank: 258590,
      level: 1,
      xp: 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const sessionRef = doc(db, 'user_sessions', `session_${ownerId}`);
    await setDoc(sessionRef, {
      userId: ownerId,
      username: 'HANSRAJxFPS',
      displayName: 'A S 友 H A N S R A J 🍃',
      bank: 258590,
      balance: 0,
      level: 1,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    logger.info('Auto-seeded system, users, and user_sessions collections in Firestore!');
  } catch (err) {
    logger.warn(`Could not auto-seed collections: ${err.message}`);
  }
};

export const connectDatabase = async () => {
  try {
    const app = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
    db = getFirestore(app);
    isConnected = true;
    logger.info(`Successfully initialized Firebase Firestore DB (Project ID: ${config.firebaseConfig.projectId})`);
    initializeAutoCollections().catch(() => {});
  } catch (error) {
    logger.error('Failed to initialize Firebase Firestore DB. Falling back to in-memory store.', error);
    isConnected = false;
  }
  return db;
};

export const getDb = () => {
  if (!db) {
    try {
      const app = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
      db = getFirestore(app);
      isConnected = true;
    } catch (err) {
      logger.error('Failed lazy initialization of Firebase Firestore DB:', err);
    }
  }
  return db;
};

export const getDbStatus = () => isConnected;
