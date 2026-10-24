// Découvrir : recherche par distance + filtres, ouvert aux visiteurs non connectés.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { FORMATS, type Format, type OffrePublique } from '../types';
import { jour, heure, libelleFormat } from '../util';
import { Icone, toast, Vide, Chargement, Reessayer } from '../ui';

const FALLBACK = { lat: 31.6295, lon: -7.9811 }; // Marrakech
const RAYONS = [5, 10, 20, 50];

export default function Decouvrir({ connecte, allerConnexion }: { connecte: boolean; allerConnexion: () => void }) {
  const [coords, setCoords] = useState<{ lat: number; lon: number; source: 'geoloc' | 'defaut' } | null>(null);
  const [format, setFormat] = useState<Format | ''>('');
  const [rayon, setRayon] = useState(20);
  const [offres, setOffres] = useState<OffrePublique[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [faits, setFaits] = useState<Set<string>>(new Set());
  const seq = useRef(0); // ignore les réponses périmées quand les filtres changent vite

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude, source: 'geoloc' }),
        () => setCoords({ ...FALLBACK, source: 'defaut' }),
        { timeout: 6000, maximumAge: 300_000 },
      );
    } else {
      setCoords({ ...FALLBACK, source: 'defaut' });
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    const n = ++seq.current;
    setOffres(null);
    setErr('');
    api.chercher(coords.lat, coords.lon, rayon, format || undefined)
      .then((r) => { if (n === seq.current) setOffres(r as OffrePublique[]); })
      .catch((e) => { if (n === seq.current) setErr((e as Error).message); });
  }, [coords, format, rayon, tick]);

  const interesser = async (o: OffrePublique) => {
    if (!connecte) {
      toast('Connecte-toi pour demander à jouer', 'erreur');
      allerConnexion();
      return;
    }
    try {
      await api.exprimerInteret(o.id);
      setFaits((s) => new Set(s).add(o.id));
      toast("Demande envoyée ✓ L'organisateur va te répondre");
    } catch (e) {
      toast((e as Error).message, 'erreur');
    }
  };

  return (
    <>
      <div className="chips" role="group" aria-label="Format">
        <button className="chip" aria-pressed={format === ''} onClick={() => setFormat('')}>Tous</button>
        {FORMATS.map((f) => (
          <button key={f} className="chip" aria-pressed={format === f} onClick={() => setFormat(f)}>
            {libelleFormat(f)}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Rayon">
        {RAYONS.map((r) => (
          <button key={r} className="chip" aria-pressed={rayon === r} onClick={() => setRayon(r)}>
            {r} km
          </button>
        ))}
      </div>

      <p className="petit muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Icone nom="pin" size={14} />
        {coords ? (coords.source === 'geoloc' ? 'Matches trouvés autour de ta position' : 'Marrakech par défaut (géoloc off)') : 'Localisation en cours…'}
      </p>

      {err && <Reessayer message={err} surClic={() => setTick((t) => t + 1)} />}
      {coords && offres === null && !err && <Chargement texte="Recherche des matchs autour de toi…" />}
      {offres?.length === 0 && (
        <Vide
          titre="Aucun match dans ce rayon"
          hint="Élargis le rayon, ou lance la partie en proposant ton propre créneau."
        />
      )}
      {offres && offres.length > 0 && (
        <p className="petit muted" style={{ marginBottom: 10 }}>
          {offres.length} match{offres.length > 1 ? 's' : ''} ouvert{offres.length > 1 ? 's' : ''}
        </p>
      )}
      <div className="grille">
      {offres?.map((o) => (
        <article className="carte" key={o.id}>
          <div className="heure"><strong>{heure(o.debut)}</strong><span>{jour(o.debut)}</span></div>
          <div className="corps">
            <h3>{libelleFormat(o.format)}</h3>
            <p className="meta">
              Organisé par {o.createurNom} · jusqu'à {heure(o.fin)}
              {o.niveauPrefere ? ` · ${o.niveauPrefere}` : ''}
            </p>
            <div className="pied">
              <span className="distance"><Icone nom="pin" size={14} />{o.distance_km.toFixed(1)} km</span>
              {faits.has(o.id)
                ? <span className="badge succes">Demande envoyée ✓</span>
                : <button className="btn mini vert" onClick={() => interesser(o)}>Je suis intéressé</button>}
            </div>
          </div>
        </article>
      ))}
      </div>
    </>
  );
}
