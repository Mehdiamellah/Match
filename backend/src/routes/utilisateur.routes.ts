import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';

const router = Router();

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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

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

    const { motDePasse: __, ...utilisateurSansMotDePasse } = utilisateur;
    res.json({
      ...utilisateurSansMotDePasse,
      stats: { victoires, nuls, defaites },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Impossible de récupérer l'utilisateur" });
  }
});

export default router;