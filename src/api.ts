import express from 'express';
import cors from 'cors';
import veo3 from './routes/veo3';

export const app = express();

app.use(cors({ origin: 'https://www.striker.marketing' }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.use('/veo3/v1', veo3)
