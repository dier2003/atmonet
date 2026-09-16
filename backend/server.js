import express from 'express';
import cors from 'cors';
import prediction from './routes/prediction.js';
import weather from './routes/weather.js';
import alerts from './routes/alerts.js';
import chatbot from './routes/chatbot.js';

const app = express();

const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    service: 'AtmoNet API'
  })
);

app.use('/api/predict', prediction);
app.use('/api/weather', weather);
app.use('/api/alerts', alerts);
app.use('/api/chatbot', chatbot);

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () =>
  console.log(`AtmoNet API listening on port ${port}`)
);