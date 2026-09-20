import express from 'express';
import { config } from '../src/config.js';
import { getDashboardHtml } from '../src/web/dashboard.js';

const app = express();

app.get('/', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/dashboard', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/guide', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/commands', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/connect', (req, res) => {
  const clientId = config.clientId || '';
  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=identify%20guilds`;
  res.redirect(oauthConnectUrl);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

export default app;
