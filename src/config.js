import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '1479052475368607926',
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

  // Firebase Admin Service Account Key
  serviceAccount: {
    type: "service_account",
    project_id: "riya-ai-girlfriend-discord-bot",
    private_key_id: "8481581c5b9ec737beceb1fceebc581a4482c46e",
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDD66UrWECFNfd+\nLadMuFEc0Z+xH+gyhTfi3+mTpja3RXJBU8YTrrChi7YpNebkJVQJBNO68yMo9vvf\n56ibY1nwpg7ZPbamw8E80dIoneo/n+YEbFwhfPdWn9VnOq//UvkAqV1lcamlr8Tb\ngUfSa4yqC6FtGitBXcQbXw/Ocdcx4UNlhG34WnI2I9QdicYM2SyxGAE/E2J3FvHU\ne5gF8zgvql1v0Dd8wFM03DdBtraJboATVYGGkAKbvSwngahKt/5XuOng+9gF4Ttl\nPj68K5V6FQjoMFzAFz7Lg9O3GErH0Yo7Pdo1ZE4SIQJIx4iFOsJ7A8TDKMaAAYTS\nESSL4YSnAgMBAAECggEAAKeZ7rIlzQwoHpDSfUwkYT9GFFZx9TFCxYxQAIFOr4AY\n6KT6BXjQ+Ek6O5sFgX+qbzlH59kGJg3lO5NPme1UEJzNceZl5NrEm4pr9FzKupmz\nMBKYoDgFr5FrKiQlEGpbkKgAOuWNVpNmygD9l3NqjerqCC5NNLO2gwznRZ5VxMHl\ncysJ+Xq52Rfkjlm40occ6vQn+6pyIu42JpPqEF5SMofPcKMDQOVP40BI/RO6aJOe\nuqVBNrUq6ij2bPCGZAW93r9FCeiiq2w6ED0CF4A0pLHQF7BYo9iMQrlgtMonklr7\nVPUPbg4PwFL9JQFygOxri+oNgf6WO7fNKsD7e2DRGQKBgQDqrOUU+/QlIua0FLlW\nnLslAA5xJWa2jcYDZVt5L0za8tJkftsth/KXv9pusu05UQ+XMXEzRNgYXf6sSGtj\n+BLHSy2aQi1xT6V3dViOMD+co1vb1Kg4D8n6UVFfwzsYHQ2vm+CbdrIOUpBrCnD/\nLEYdk4C+4e+l/TREO+0jZ+LTSwKBgQDVuThQMoV64BuirCRly174atBbtKS4VHPn\nqqp5r5/bqGDGJ15fZYfZMQGA1BYSfU4v4L3lGFwCZ/hDM08ozA+3D+M7iiVleZGz\nBzFJFYKZGf05WSfnrb6H9VwINqgsOyYefizdlmCmKj43ZWP39tpgtuJiK+zhCAV/\nD4ltbnVelQKBgQDA2Ck8EDu11LNeonUXXp5PLnevtPtt4p0opz7/G8Z9WfNYkAJO\nrRvGZer68uAMLLeyF/gdGGK3y23/Z1eQhAfya63iyKUNK1UfEHggCDgN4RQYVu2R\nfDAPGonTNty12RIpD+AIAQcay/BPdfobRuerYE35DjNf5O3xcIlTgggcdwKBgCD8\ndF+UXJupaTqDPR7k86R9v+jXibDVgAoagjND0vVxGHac7ujkX8I62ROMKFf0NRQY\nqNZqGxFYAK5Ghgoy7J4Ber3exYTS7ZTnIEk6Y6zDoRyv0QPmAgkz6l9uKCijSwwb\nx0rwAbzDulSMdpB37h6NO4WRZ/8XYNnKiRh1uvG9AoGAdk/ziCXtI8hFKXZDKiD6\ncLAdikQyzpqL4wlS2fnHIhJGcdgzqnpOE9Nk8HfLUviybUZw8oNrtmy4S+26/rCC\nRuaviNH0AXkoufbfxR1TES0DaG5FriO1Fjcsj6NbHvAcBgEXqsBzqbn+pBirM50C\n3EH0oMwDMtYfBJ6VNIuNh/I=\n-----END PRIVATE KEY-----\n").replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@riya-ai-girlfriend-discord-bot.iam.gserviceaccount.com",
    client_id: "105597115116070889226",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40riya-ai-girlfriend-discord-bot.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
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
