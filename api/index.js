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
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/auth/callback`;

  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds%20bot%20applications.commands&permissions=51200&integration_type=0`;
  res.redirect(oauthConnectUrl);
});

app.get('/auth/callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/');
  }
  res.status(200).send(getDashboardHtml(null, { connected: true, code }));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

export default app;
