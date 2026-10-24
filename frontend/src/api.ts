// Toutes les routes du backend sont ici. Si une route diffère chez toi, change-la uniquement dans ce fichier.
const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t: string | null) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

async function req(path: string, opts: RequestInit = {}) {
  const t = getToken();
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Une erreur est survenue');
  return data;
}

export const api = {
  // À VÉRIFIER : route et champs de connexion (je ne les ai pas vus dans la conversation).
  login: (telephone: string, motDePasse: string) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ telephone, motDePasse }) }),
  search: (lat: number, lon: number, format?: string) =>
    req(`/offres-match?latitude=${lat}&longitude=${lon}${format ? `&format=${format}` : ''}`),
  mesOffres: () => req('/offres-match/moi'),
  creer: (body: object) => req('/offres-match', { method: 'POST', body: JSON.stringify(body) }),
  // À VÉRIFIER : route pour exprimer son intérêt.
  interet: (offreId: string) => req(`/offres-match/${offreId}/interets`, { method: 'POST' }),
};
