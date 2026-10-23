import { Router } from 'express';
import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { verifierToken, RequeteAuthentifiee } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const { debut, fin, format, niveauPrefere } = req.body;
    const createurId = req.utilisateurId as string;

    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime()) || dateFin <= dateDebut) {
      return res.status(400).json({ error: 'Créneau invalide' });
    }

    const conflit = await prisma.offreMatch.findFirst({
      where: {
        statut: { in: ['OUVERTE', 'MATCHEE'] },
        debut: { lt: dateFin },
        fin: { gt: dateDebut },
        OR: [
          { createurId },
          { interets: { some: { utilisateurId: createurId, statut: 'CONFIRME' } } },
        ],
      },
    });

    if (conflit) {
      return res.status(409).json({ error: 'Vous avez déjà une offre ou un match sur ce créneau' });
    }

    const offre = await prisma.offreMatch.create({
      data: { debut: dateDebut, fin: dateFin, format, niveauPrefere, createurId },
    });

    res.status(201).json(offre);
  } catch (error) {
    res.status(400).json({ error: "Impossible de créer l'offre" });
  }
});

router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, format, rayon } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont obligatoires pour la recherche' });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const rayonKm = rayon ? parseFloat(rayon as string) : 20;

    if (isNaN(lat) || isNaN(lon) || isNaN(rayonKm)) {
      return res.status(400).json({ error: 'Paramètres de recherche invalides' });
    }

    const filtreFormat = format
      ? Prisma.sql`AND o.format = ${format}::"Format"`
      : Prisma.empty;

    const offres = await prisma.$queryRaw`
      SELECT * FROM (
        SELECT
          o.*,
          u.nom AS "createurNom",
          (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${lat})) * cos(radians(u.latitude)) *
                cos(radians(u.longitude) - radians(${lon})) +
                sin(radians(${lat})) * sin(radians(u.latitude))
              ))
            )
          ) AS distance_km
        FROM "OffreMatch" o
        JOIN "Utilisateur" u ON u.id = o."createurId"
        WHERE o.statut = 'OUVERTE'
        ${filtreFormat}
      ) AS offres
      WHERE distance_km <= ${rayonKm}
      ORDER BY distance_km ASC
    `;

    res.json(offres);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erreur lors de la recherche' });
  }
});

router.get('/:id/interets', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const id = req.params.id as string;
    const utilisateurId = req.utilisateurId as string;

    const offre = await prisma.offreMatch.findUnique({
      where: { id },
      include: {
        interets: {
          orderBy: { dateDemande: 'asc' },
          include: {
            utilisateur: { select: { id: true, nom: true, photo: true, telephone: true } },
          },
        },
      },
    });

    if (!offre) {
      return res.status(404).json({ error: 'Offre introuvable' });
    }

    if (offre.createurId !== utilisateurId) {
      return res.status(403).json({ error: "Seul le créateur peut voir les intérêts de l'offre" });
    }

    const interets = offre.interets.map((i) => ({
      id: i.id,
      statut: i.statut,
      dateDemande: i.dateDemande,
      utilisateur: {
        id: i.utilisateur.id,
        nom: i.utilisateur.nom,
        photo: i.utilisateur.photo,
        telephone: i.statut === 'REFUSE' ? null : i.utilisateur.telephone,
      },
    }));

    res.json(interets);
  } catch (error) {
    res.status(400).json({ error: 'Impossible de récupérer les intérêts' });
  }
});

router.patch('/:id/resultat', verifierToken, async (req: RequeteAuthentifiee, res) => {
  try {
    const id = req.params.id as string;
    const { resultat } = req.body;
    const utilisateurId = req.utilisateurId as string;

    const offre = await prisma.offreMatch.findUnique({
      where: { id },
    });

    if (!offre) {
      return res.status(404).json({ error: 'Offre introuvable' });
    }

    if (offre.createurId !== utilisateurId) {
      return res.status(403).json({ error: 'Seul le créateur peut enregistrer le résultat' });
    }

    if (offre.statut !== 'MATCHEE') {
      return res.status(400).json({ error: "Impossible d'enregistrer un résultat pour une offre non matchée" });
    }

    const offreMiseAJour = await prisma.offreMatch.update({
      where: { id },
      data: { resultat },
    });

    res.json(offreMiseAJour);
  } catch (error) {
    res.status(400).json({ error: "Impossible d'enregistrer le résultat" });
  }
});

export default router;