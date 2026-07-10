import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb } from './db/database';
import paymentRoutes from './routes/payment.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PromptPay Demo Server 🚀', port: PORT });
});

// Serve frontend build
// __dirname = promptpay-demo/server/dist/ → go up 2 to server/ then up 1 to promptpay-demo/
const serverRoot = path.join(__dirname, '..'); // server/
const promptpayDemoRoot = path.join(serverRoot, '..'); // promptpay-demo/
const clientDist = path.join(promptpayDemoRoot, 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🟢 PromptPay Demo running at http://localhost:${PORT}`);
    console.log(`⚠️  นี่คือ demo เพื่อการเรียนรู้เท่านั้น — ไม่มีเงินจริงหมุนเวียน\n`);
  });
}).catch((err) => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
