import express from 'express';
import cors from 'cors';
import prediction from './routes/prediction.js';
import weather from './routes/weather.js';
import alerts from './routes/alerts.js';
import chatbot from './routes/chatbot.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'AtmoNet API' })
);

app.use('/api/predict', prediction);
app.use('/api/weather', weather);
app.use('/api/alerts', alerts);
app.use('/api/chatbot', chatbot);

app.listen(5000, () =>
  console.log('AtmoNet API running on http://localhost:5000')
);
