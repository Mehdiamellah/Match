// Types tirés des routes Express réelles (auth, utilisateurs, offres-match, interets).

export type Format = 'CINQ_VS_CINQ' | 'SIX_VS_SIX';
export const FORMATS: Format[] = ['CINQ_VS_CINQ', 'SIX_VS_SIX'];

export type StatutOffre = 'OUVERTE' | 'MATCHEE';
export type StatutInteret = 'EN_ATTENTE' | 'CONFIRME' | 'REFUSE';
export type Resultat = 'VICTOIRE_CREATEUR' | 'VICTOIRE_INTERESSE' | 'NUL';

/** GET /offres-match (recherche) */
export type OffrePublique = {
  id: string;
  debut: string;
  fin: string;
  format: string;
  niveauPrefere: string | null;
  statut: string;
  createurNom: string;
  distance_km: number;
};

/** GET /offres-match/moi */
export type OffreMoi = {
  id: string;
  debut: string;
  fin: string;
  format: string;
  niveauPrefere: string | null;
  statut: StatutOffre;
  resultat: Resultat | null;
  createdAt: string;
  _count: { interets: number };
};

/** GET /offres-match/:id/interets */
export type Interesse = {
  id: string;
  statut: StatutInteret;
  dateDemande: string;
  utilisateur: { id: string; nom: string; photo: string | null; telephone: string | null };
};

/** GET /interets/moi */
export type MaDemande = {
  id: string;
  statut: StatutInteret;
  dateDemande: string;
  offre: {
    id: string;
    debut: string;
    fin: string;
    format: string;
    niveauPrefere: string | null;
    statut: string;
  };
  createur: { id: string; nom: string; photo: string | null; telephone?: string | null };
};

export type Stats = { victoires: number; nuls: number; defaites: number };

/** GET /utilisateurs/moi */
export type Profil = {
  id: string;
  nom: string;
  telephone: string;
  photo: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  stats: Stats;
};
