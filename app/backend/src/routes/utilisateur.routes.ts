import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';
import { verifierToken, RequeteAuthentifiee } from '../middleware/auth.middleware';

const router = Router();

async function calculerStats(id: string) {
  const offresCreees = await prisma.offreMatch.findMany({
    where: { createurId: id, resultat: { not: null } },
  });

  const interetsConfirmes = await prisma.interet.findMany({
    where: { utilisateurId: id, statut: 'CONFIRME' },
    include: { offreMatch: true },
  });
  const offresJoueesEnTantQuInteresse = interetsConfirmes
    .map((i) => i.offreMatch)
    .filter((o) => o.resultat !== null);

  const toutesLesOffresJouees = [...offresCreees, ...offresJoueesEnTantQuInteresse];

  let victoires = 0;
  let nuls = 0;
  let defaites = 0;

  for (const offre of toutesLesOffresJouees) {
    const estCreateur = offre.createurId === id;

    if (offre.resultat === 'NUL') {
      nuls++;
    } else if (
      (offre.resultat === 'VICTOIRE_CREATEUR' && estCreateur) ||
      (offre.resultat === 'VICTOIRE_INTERESSE' && !estCreateur)
    ) {
      victoires++;
    } else {
      defaites++;
    }
  }

  return { victoires, nuls, defaites };
}

router.post('/', async (req, res) => {
  try {
    const { nom, telephone, motDePasse, photo, latitude, longitude } = req.body;

    const motDePasseHache = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await prisma.utilisateur.create({
      data: { nom, telephone, motDePasse: motDePasseHache, photo, latitude, longitude },
    });

    const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;
    res.status(201).json(utilisateurSansMotDePasse);
  } catch (error) {
    res.status(400).json({ error: "Impossible de créer l'utilisateur" });
  }
});

router.get('/moi', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const id = req.utilisateurId as string;

    const utilisateur = await prisma.utilisateur.findUnique({ where: { id } });

    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const { motDePasse: _, ...profil } = utilisateur;
    res.json({ ...profil, stats: await calculerStats(id) });
  } catch (error) {
    res.status(400).json({ error: 'Impossible de récupérer le profil' });
  }
});

router.patch('/moi', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const id = req.utilisateurId as string;
    const { nom, photo, latitude, longitude } = req.body;

    const data: { nom?: string; photo?: string | null; latitude?: number; longitude?: number } = {};
    if (typeof nom === 'string' && nom.trim()) data.nom = nom.trim();
    if (typeof photo === 'string' || photo === null) data.photo = photo;
    if (latitude !== undefined) {
      const lat = parseFloat(String(latitude));
      if (isNaN(lat) || lat < -90 || lat > 90) return res.status(400).json({ error: 'Latitude invalide' });
      data.latitude = lat;
    }
    if (longitude !== undefined) {
      const lon = parseFloat(String(longitude));
      if (isNaN(lon) || lon < -180 || lon > 180) return res.status(400).json({ error: 'Longitude invalide' });
      data.longitude = lon;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

    const u = await prisma.utilisateur.update({ where: { id }, data });
    const { motDePasse: _, ...profil } = u;
    res.json(profil);
  } catch (error) {
    res.status(400).json({ error: 'Impossible de mettre à jour le profil' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: { id: true, nom: true, photo: true, createdAt: true },
    });

    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({ ...utilisateur, stats: await calculerStats(id) });
  } catch (error) {
    res.status(400).json({ error: "Impossible de récupérer l'utilisateur" });
  }
});

export default router;