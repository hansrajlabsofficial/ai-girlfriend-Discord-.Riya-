import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let db = null;
let isConnected = false;

export const connectDatabase = async () => {
  try {
    const app = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
    db = getFirestore(app);
    isConnected = true;
    logger.info(`Successfully initialized Firebase Firestore DB (Project ID: ${config.firebaseConfig.projectId})`);
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
