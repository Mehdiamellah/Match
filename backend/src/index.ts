import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';
import utilisateurRoutes from './routes/utilisateur.routes';
import offreMatchRoutes from './routes/offrematch.routes';
import interetRoutes from './routes/interet.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/utilisateurs', utilisateurRoutes);
app.use('/auth', authRoutes);
app.use('/offres-match', offreMatchRoutes);
app.use('/interets', interetRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});