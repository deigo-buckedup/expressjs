import express from 'express';
import cors from 'cors';
import veo3 from './routes/veo3';
import banana from './routes/banana';
import segment from './routes/segment';

export const app = express();

app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.use('/veo3/v1', veo3)
app.use('/banana/v1', banana)
app.use('/segment/v1', segment)
