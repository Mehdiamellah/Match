// Formatage dates / libellés / contacts — tout en français, comme le backend.

export const jour = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const dateComplete = (iso: string) => `${jour(iso)} à ${heure(iso)}`;

export const libelleFormat = (f: string) =>
  f === 'CINQ_VS_CINQ' ? '5v5' : f === 'SIX_VS_SIX' ? '6v6' : f;

export const libelleStatutOffre = (s: string) => (s === 'OUVERTE' ? 'Ouverte' : 'Matchée');

export const libelleDemande = (s: string) =>
  s === 'EN_ATTENTE' ? 'En attente' : s === 'CONFIRME' ? 'Confirmée' : 'Refusée';

export const libelleResultat = (r: string) =>
  r === 'VICTOIRE_CREATEUR' ? 'Victoire : notre équipe' : r === 'VICTOIRE_INTERESSE' ? 'Victoire : adversaires' : 'Match nul';

export const initiales = (nom: string) =>
  nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0]?.toUpperCase() ?? '').join('') || '?';

export const telLien = (t: string) => `tel:${t.replace(/\s+/g, '')}`;

export const whatsappLien = (t: string) => {
  let n = t.replace(/\D/g, '');
  if (n.startsWith('0')) n = '212' + n.slice(1); // 0X… → +212…
  return `https://wa.me/${n}`;
};

/** Positions pré-définies (quand la géoloc est refusée ou pour corriger). */
export type PositionPredefinie = { nom: string; lat: number; lon: number };
export const POSITIONS: PositionPredefinie[] = [
  { nom: 'Marrakech — Guéliz', lat: 31.6362, lon: -8.0089 },
  { nom: 'Marrakech — Médina', lat: 31.6269, lon: -7.9911 },
  { nom: 'Marrakech — Agdal', lat: 31.6019, lon: -7.9906 },
  { nom: 'Marrakech — Mhamid', lat: 31.5965, lon: -7.9293 },
  { nom: 'Marrakech — Sidi Ghanem', lat: 31.674, lon: -8.045 },
  { nom: 'Casablanca', lat: 33.5731, lon: -7.5898 },
  { nom: 'Rabat — Salé', lat: 34.0209, lon: -6.8416 },
  { nom: 'Agadir', lat: 30.4278, lon: -9.5981 },
];
