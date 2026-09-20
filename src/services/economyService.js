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

export const addBalance = async (userDoc, amount) => {
  let finalAmount = amount;
  if (amount > 0 && userDoc.userId) {
    try {
      const topUsers = await getGlobalTopBankUsers(10);
      const isTop10 = topUsers.some(u => u.userId === userDoc.userId);
      if (isTop10) {
        const perkBonus = Math.max(1, Math.round(amount * 0.005)); // +0.5% Extra Money Perk
        finalAmount += perkBonus;
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
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('RIYA OFFICIAL BANK & AFFECTION CARD', 50, 65);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '14px sans-serif';
  ctx.fillText('CARD ID: ' + (user.id ? user.id.slice(0, 12) : '000000000000') + ' • PREMIUM MEMBER', 50, 90);

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

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  const usernameText = user.displayName || user.username || 'Valued User';
  ctx.fillText(usernameText, infoX, 155);

  // Level & Relationship Title
  const level = userDoc.level || 1;
  const title = getRelationshipTitle(level);
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

  // Balance Display Section
  ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.font = '16px sans-serif';
  ctx.fillText('CURRENT BANK BALANCE', 50, 310);

  const balance = getBalance(userDoc);
  ctx.fillStyle = '#50FFB1'; // Emerald Green
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(formatMoney(balance), 50, 360);

  // Partner Section (Bottom Right)
  const currentPartner = partnerName || (userDoc.isDailyPartner ? "👑 Riya's Partner of the Day" : "Riya 💕");
  ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
  ctx.font = '16px sans-serif';
  ctx.fillText('OFFICIAL PARTNER', 480, 310);

  ctx.fillStyle = '#FF69B4'; // Hot Pink
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(currentPartner, 480, 350);

  // Return PNG Buffer
  return canvas.toBuffer('image/png');
};
