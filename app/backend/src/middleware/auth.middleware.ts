import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequeteAuthentifiee extends Request {
  utilisateurId?: string;
}

export function verifierToken(req: RequeteAuthentifiee, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return res.status(401).json({ error: 'Token ou configuration manquante' });
  }

  try {
    const decoded = jwt.verify(token, secret) as unknown as { utilisateurId: string };
    req.utilisateurId = decoded.utilisateurId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function verifierTokenOptionnel(req: RequeteAuthentifiee, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (authHeader && authHeader.startsWith('Bearer ') && secret) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, secret) as unknown as { utilisateurId: string };
        req.utilisateurId = decoded.utilisateurId;
      } catch (error) {
        // token invalide : on continue comme un visiteur anonyme
      }
    }
  }

  next();
}