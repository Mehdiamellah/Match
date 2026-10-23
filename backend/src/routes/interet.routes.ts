import { Router } from 'express';
import prisma from '../prisma';
import { verifierToken, RequeteAuthentifiee } from '../middleware/auth.middleware';

const router = Router();

async function aUnConflit(userId: string, debut: Date, fin: Date, offreIdExclue: string) {
  const conflit = await prisma.offreMatch.findFirst({
    where: {
      id: { not: offreIdExclue },
      statut: 'MATCHEE',
      debut: { lt: fin },
      fin: { gt: debut },
      OR: [
        { createurId: userId },
        { interets: { some: { utilisateurId: userId, statut: 'CONFIRME' } } },
      ],
    },
  });
  return conflit !== null;
}

router.post('/', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const { offreMatchId } = req.body;
    const utilisateurId = req.utilisateurId as string;

    const offre = await prisma.offreMatch.findUnique({
      where: { id: offreMatchId },
    });

    if (!offre) {
      return res.status(404).json({ error: 'Offre introuvable' });
    }

    if (offre.createurId === utilisateurId) {
      return res.status(400).json({ error: "Impossible d'exprimer un intérêt sur sa propre offre" });
    }

    if (offre.statut !== 'OUVERTE') {
      return res.status(400).json({ error: "Cette offre est déjà matchée, impossible d'exprimer un intérêt" });
    }

    const interet = await prisma.interet.create({
      data: { utilisateurId, offreMatchId },
    });

    res.status(201).json(interet);
  } catch (error) {
    res.status(400).json({ error: "Impossible d'exprimer l'intérêt (peut-être déjà fait ?)" });
  }
});

router.patch('/:id/confirmer', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const id = req.params.id as string;
    const utilisateurId = req.utilisateurId as string;

    const interet = await prisma.interet.findUnique({
      where: { id },
      include: { offreMatch: true },
    });

    if (!interet) {
      return res.status(404).json({ error: 'Intérêt introuvable' });
    }

    if (interet.offreMatch.createurId !== utilisateurId) {
      return res.status(403).json({ error: "Seul le créateur de l'offre peut confirmer un intérêt" });
    }

    if (interet.offreMatch.statut !== 'OUVERTE') {
      return res.status(400).json({ error: 'Cette offre est déjà matchée' });
    }

    if (interet.statut !== 'EN_ATTENTE') {
      return res.status(400).json({ error: "Cet intérêt n'est plus en attente" });
    }

    const { debut, fin } = interet.offreMatch;

    if (await aUnConflit(interet.offreMatch.createurId, debut, fin, interet.offreMatchId)) {
      return res.status(409).json({ error: 'Vous avez déjà un match confirmé sur ce créneau' });
    }

    if (await aUnConflit(interet.utilisateurId, debut, fin, interet.offreMatchId)) {
      return res.status(409).json({ error: 'Cet utilisateur a déjà un match confirmé sur ce créneau' });
    }

    const offresEnConflit = {
      createurId: interet.utilisateurId,
      statut: 'OUVERTE' as const,
      debut: { lt: fin },
      fin: { gt: debut },
      id: { not: interet.offreMatchId },
    };

    const [interetConfirme, autresRefuses, offreMiseAJour, , offresSupprimees] =
      await prisma.$transaction([
        prisma.interet.update({
          where: { id },
          data: { statut: 'CONFIRME' },
        }),
        prisma.interet.updateMany({
          where: {
            offreMatchId: interet.offreMatchId,
            id: { not: id },
            statut: 'EN_ATTENTE',
          },
          data: { statut: 'REFUSE' },
        }),
        prisma.offreMatch.update({
          where: { id: interet.offreMatchId },
          data: { statut: 'MATCHEE' },
        }),
        prisma.interet.deleteMany({
          where: { offreMatch: offresEnConflit },
        }),
        prisma.offreMatch.deleteMany({
          where: offresEnConflit,
        }),
      ]);

    res.json({
      interet: interetConfirme,
      nombreRefuses: autresRefuses.count,
      offre: offreMiseAJour,
      offresSupprimees: offresSupprimees.count,
    });
  } catch (error) {
    res.status(400).json({ error: 'Impossible de confirmer cet intérêt' });
  }
});

router.get('/moi', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const utilisateurId = req.utilisateurId as string;

    const interets = await prisma.interet.findMany({
      where: { utilisateurId },
      orderBy: { dateDemande: 'desc' },
      include: {
        offreMatch: {
          include: {
            createur: { select: { id: true, nom: true, photo: true, telephone: true } },
          },
        },
      },
    });

    const resultat = interets.map((i) => {
      const { telephone, ...createurPublic } = i.offreMatch.createur;
      return {
        id: i.id,
        statut: i.statut,
        dateDemande: i.dateDemande,
        offre: {
          id: i.offreMatch.id,
          debut: i.offreMatch.debut,
          fin: i.offreMatch.fin,
          format: i.offreMatch.format,
          niveauPrefere: i.offreMatch.niveauPrefere,
          statut: i.offreMatch.statut,
        },
        createur: i.statut === 'CONFIRME' ? { ...createurPublic, telephone } : createurPublic,
      };
    });

    res.json(resultat);
  } catch (error) {
    res.status(400).json({ error: 'Impossible de récupérer vos intérêts' });
  }
});

export default router;