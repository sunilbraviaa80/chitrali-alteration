// backend/index.js
import express from 'express';
import cors from 'cors';
import alterationsRouter from './routes/alterations.js';

const app = express();

// allow your frontend to call this API
app.use(cors());
app.use(express.json());

app.use('/alterations', alterationsRouter);

// health check
app.get('/', (req, res) => {
  res.send('Chitrali Alteration API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
