import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getRelationshipTitle } from './rpgService.js';
import { logger } from '../utils/logger.js';

export const GIFTS = {
  diamond_ring: {
    id: 'diamond_ring',
    name: 'Diamond Ring',
    emoji: '💍',
    price: 500000,
    xpBoost: 1000,
    description: 'The ultimate symbol of eternal devotion and luxury! 💖'
  },
  red_flower: {
    id: 'red_flower',
    name: 'Red Flower',
    emoji: '🌹',
    price: 400,
    xpBoost: 50,
    description: 'A sweet and romantic red rose. 🌹'
  },
  teddy_bear: {
    id: 'teddy_bear',
    name: 'Teddy Bear',
    emoji: '🧸',
    price: 100,
    xpBoost: 20,
    description: 'A cozy, cute fluffy teddy bear! 🧸'
  }
};

export const getBalance = (userDoc) => {
  return userDoc.balance !== undefined ? userDoc.balance : 10000;
};

export const hasBalance = (userDoc, amount) => {
  return getBalance(userDoc) >= amount;
};

import { getGlobalTopBankUsers } from '../database/models/User.js';

export const TOP_RANK_PERKS = {
  1: { pct: '+2.0%', mult: 0.020 },
  2: { pct: '+1.0%', mult: 0.010 },
  3: { pct: '+0.90%', mult: 0.0090 },
  4: { pct: '+0.80%', mult: 0.0080 },
  5: { pct: '+0.70%', mult: 0.0070 },
  6: { pct: '+0.60%', mult: 0.0060 },
  7: { pct: '+0.50%', mult: 0.0050 },
  8: { pct: '+0.30%', mult: 0.0030 },
  9: { pct: '+0.10%', mult: 0.0010 },
  10: { pct: '+0.05%', mult: 0.0005 }
};

export const addBalance = async (userDoc, amount) => {
  let finalAmount = amount;
  if (amount > 0 && userDoc.userId) {
    try {
      const topUsers = await getGlobalTopBankUsers(10);
      const rankIdx = topUsers.findIndex(u => u.userId === userDoc.userId);
      if (rankIdx !== -1) {
        const rank = rankIdx + 1;
        const perk = TOP_RANK_PERKS[rank];
        if (perk) {
          const perkBonus = Math.max(1, Math.round(amount * perk.mult));
          finalAmount += perkBonus;
        }
      }
    } catch (err) {
      // Ignore perk check error if fails
    }
  }
  userDoc.balance = (userDoc.balance !== undefined ? userDoc.balance : 10000) + finalAmount;
  if (userDoc.save) await userDoc.save();
  return userDoc.balance;
};

export const deductBalance = async (userDoc, amount) => {
  const current = getBalance(userDoc);
  if (current < amount) return false;
  userDoc.balance = current - amount;
  if (userDoc.save) await userDoc.save();
  return true;
};

/**
 * Format currency with commas (e.g. 500000 -> "$500,000")
 */
export const formatMoney = (amount) => {
  return '$' + (amount || 0).toLocaleString('en-US');
};

/**
 * Clean text for Canvas rendering to remove emojis, non-printable characters, 
 * and special Unicode symbols that turn into hollow boxes (🗌) on Node Canvas.
 */
export function cleanCanvasText(str) {
  if (!str) return 'Valued Member';
  let cleaned = str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B50}]/gu, '')
    .replace(/[^\x20-\x7E\u00C0-\u024F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Valued Member';
}

/**
 * Renders a visual Bank Card Image using @napi-rs/canvas
 */
export const renderBankCard = async (user, userDoc, partnerName = null) => {
  const width = 800;
  const height = 450;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background Gradient (Dark Luxury Metallic Pink/Purple)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#1E0638');
  bgGrad.addColorStop(0.5, '#3B0A45');
  bgGrad.addColorStop(1, '#660F45');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative Card Hologram Overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  ctx.arc(650, 100, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(750, 350, 200, 0, Math.PI * 2);
  ctx.fill();

  // Card Border Frame (Gold Accent)
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // Inner Subtle Line
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  // Bank Header Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('RIYA OFFICIAL BANK & AFFECTION CARD', 50, 65);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '14px sans-serif';
  ctx.fillText('CARD ID: ' + (user.id ? user.id.slice(0, 12) : '000000000000') + ' • PREMIUM MEMBER', 50, 90);

  // Draw Official Bank Logo (Top Right)
  try {
    const logoUrl = 'https://i.postimg.cc/63xkK4YM/HANSRAJ-AYAN-OFFICIAL-COMMUNITY-Global-Bank-discord-server.png';
    const logoImg = await loadImage(logoUrl);
    ctx.drawImage(logoImg, 655, 30, 90, 90);
  } catch (err) {
    // Ignore logo draw error if offline
  }

  // Draw Avatar
  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatarImage = await loadImage(avatarUrl);

    const avatarX = 50;
    const avatarY = 120;
    const avatarRadius = 65;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatarImage, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();

    // Gold Ring around Avatar
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
    ctx.stroke();
  } catch (err) {
    logger.warn(`Failed to load avatar for canvas card: ${err.message}`);
  }

  // User Details (Right of Avatar)
  const infoX = 210;

  // Username (Sanitized to prevent hollow square boxes)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px sans-serif';
  const usernameText = cleanCanvasText(user.displayName || user.username || 'Valued User');
  ctx.fillText(usernameText, infoX, 155);

  // Level & Relationship Title
  const level = userDoc.level || 1;
  const title = cleanCanvasText(getRelationshipTitle(level));
  ctx.fillStyle = '#FFB6C1';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Level ${level} • ${title}`, infoX, 190);

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 270);
  ctx.lineTo(750, 270);
  ctx.stroke();

  // Bank Savings Balance Section
  ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.font = '14px sans-serif';
  ctx.fillText('BANK SAVINGS BALANCE', 50, 300);

  const bankSavings = userDoc.bank || 0;
  ctx.fillStyle = '#50FFB1'; // Emerald Green
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(formatMoney(bankSavings), 50, 340);

  // Wallet Cash Section
  ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
  ctx.font = '13px sans-serif';
  ctx.fillText('WALLET CASH', 50, 372);

  const walletCash = getBalance(userDoc);
  ctx.fillStyle = '#FFB6C1'; // Soft Pink
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(formatMoney(walletCash), 50, 398);

  // Partner Section (Middle Right)
  const rawPartner = partnerName || (userDoc.isDailyPartner ? "Riya Partner of the Day" : "Riya");
  const currentPartner = cleanCanvasText(rawPartner);
  ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
  ctx.font = '14px sans-serif';
  ctx.fillText('OFFICIAL PARTNER', 480, 295);

  ctx.fillStyle = '#FF69B4'; // Hot Pink
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(currentPartner, 480, 320);

  // Authorised Signature Strip (Bottom Right)
  const signatureText = generateUserSignature(user);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px sans-serif';
  ctx.fillText('AUTHORISED SIGNATURE', 480, 355);

  // Signature Box Strip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(480, 362, 260, 42);
  ctx.strokeRect(480, 362, 260, 42);

  // Cursive Signature Text
  ctx.fillStyle = '#FFD700'; // Gold Calligraphy
  ctx.font = 'italic bold 22px Georgia, serif';
  ctx.fillText(cleanCanvasText(signatureText), 495, 392);

  // Return PNG Buffer
  return canvas.toBuffer('image/png');
};

/**
 * Generates official signature string: First Initial + Dot + Last Name (e.g. HANSRAJ VAGHELA -> H.VAGHELA)
 */
export function generateUserSignature(user) {
  const rawName = cleanCanvasText(user?.displayName || user?.username || 'HANSRAJ VAGHELA');
  const words = rawName.split(/[\s._-]+/).filter(Boolean);

  if (words.length >= 2) {
    const firstInitial = words[0][0].toUpperCase();
    const lastName = words[words.length - 1].toUpperCase();
    return `${firstInitial}.${lastName}`;
  } else if (words.length === 1) {
    const word = words[0].toUpperCase();
    return `${word[0]}.${word}`;
  }
  return 'H.VAGHELA';
}
