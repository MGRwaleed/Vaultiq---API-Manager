import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import apiKeyRoutes from './routes/apiKeys.js';
import usageRoutes from './routes/usage.js';
import logsRoutes from './routes/logs.js';
import proxyRoutes from './routes/proxy.js';
import settingsRoutes from './routes/settings.js';
import healthRoutes from './routes/health.js';

connectDB();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/keys',      apiKeyRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('*', (_, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
