import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Tipsters Hub API', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Tipsters Hub Server running on http://localhost:${PORT}`);
});
