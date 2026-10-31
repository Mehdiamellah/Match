import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { telephone, motDePasse } = req.body;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { telephone },
    });

    if (!utilisateur) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);

    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { utilisateurId: utilisateur.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la connexion' });
  }
});

export default router;