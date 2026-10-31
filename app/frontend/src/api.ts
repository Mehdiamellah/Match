// Couche API unique — les routes reflètent exactement backend/src/routes.
const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t: string | null) =>
  t ? localStorage.setItem('token', t) : localStorage.removeItem('token');

async function req(path: string, opts: RequestInit = {}) {
  const t = getToken();
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || 'Une erreur est survenue');
  return data;
}

export const api = {
  // POST /auth/login
  connexion: (telephone: string, motDePasse: string) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ telephone, motDePasse }) }),

  // POST /utilisateurs
  inscription: (corps: {
    nom: string; telephone: string; motDePasse: string;
    photo?: string | null; latitude: number; longitude: number;
  }) => req('/utilisateurs', { method: 'POST', body: JSON.stringify(corps) }),

  // GET /utilisateurs/moi
  profilMoi: () => req('/utilisateurs/moi'),

  // PATCH /utilisateurs/moi (nom, photo, position)
  majProfil: (corps: { nom?: string; photo?: string | null; latitude?: number; longitude?: number }) =>
    req('/utilisateurs/moi', { method: 'PATCH', body: JSON.stringify(corps) }),

  // GET /offres-match?latitude&longitude&rayon&format
  chercher: (lat: number, lon: number, rayon: number, format?: string) =>
    req(`/offres-match?latitude=${lat}&longitude=${lon}&rayon=${rayon}${format ? `&format=${format}` : ''}`),

  // POST /offres-match
  creer: (corps: { debut: string; fin: string; format: string; niveauPrefere?: string | null }) =>
    req('/offres-match', { method: 'POST', body: JSON.stringify(corps) }),

  // GET /offres-match/moi
  mesOffres: () => req('/offres-match/moi'),

  // GET /offres-match/:id/interets
  interesses: (offreId: string) => req(`/offres-match/${offreId}/interets`),

  // POST /interets { offreMatchId }   ← ancien front appelait la mauvaise route
  exprimerInteret: (offreMatchId: string) =>
    req('/interets', { method: 'POST', body: JSON.stringify({ offreMatchId }) }),

  // PATCH /interets/:id/confirmer
  confirmer: (interetId: string) => req(`/interets/${interetId}/confirmer`, { method: 'PATCH' }),

  // GET /interets/moi
  mesDemandes: () => req('/interets/moi'),

  // PATCH /offres-match/:id/resultat
  enregistrerResultat: (offreId: string, resultat: string) =>
    req(`/offres-match/${offreId}/resultat`, { method: 'PATCH', body: JSON.stringify({ resultat }) }),
};
