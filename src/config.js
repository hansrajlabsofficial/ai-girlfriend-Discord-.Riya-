import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  tenorApiKey: process.env.TENOR_API_KEY || '',
  port: process.env.PORT || 3000,
  
  // Firebase Configuration
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDBpJp36BBdG_fh5WiiFS4e8WnBbPN5dGg",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "riya-ai-girlfriend-discord-bot.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://riya-ai-girlfriend-discord-bot-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "riya-ai-girlfriend-discord-bot",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "riya-ai-girlfriend-discord-bot.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1016322069093",
    appId: process.env.FIREBASE_APP_ID || "1:1016322069093:web:51cc280facd87caa5d2c8c",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-9XWSX7RFF7"
  },

  // Dynamic Bot Settings
  botName: 'Riya', // Amdavadi AI Girlfriend Persona
  randomChatChance: 0.20, // 1 in 5 (20%) chance to reply naturally
  randomEventChance: 0.05 // 5% chance on message for spontaneous event
};

export const validateConfig = () => {
  const missing = [];
  if (!config.discordToken || config.discordToken.includes('your_discord_bot_token')) missing.push('DISCORD_TOKEN');
  if (!config.clientId || config.clientId.includes('your_discord_client_id')) missing.push('CLIENT_ID');
  
  if (missing.length > 0) {
    console.warn(`[WARN] Missing critical environment variables in .env: ${missing.join(', ')}`);
    console.warn(`[WARN] Please fill out .env with your tokens before launching in production.`);
  }
};
