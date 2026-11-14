// Découvrir : "Où veux-tu jouer ?" — position réelle par défaut, villes en chips,
// rayon fixe (50 km). Ouvert aux visiteurs non connectés.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { FORMATS, type Format, type OffrePublique } from '../types';
import { jour, heure, libelleFormat } from '../util';
import { Icone, toast, Vide, Chargement, Reessayer } from '../ui';

// Coordonnées des centres-ville (une seule source de vérité, facile à étendre)
const VILLES = [
  { nom: 'Marrakech', lat: 31.6295, lon: -7.9811 },
  { nom: 'Casablanca', lat: 33.5731, lon: -7.5898 },
  { nom: 'Rabat', lat: 34.0209, lon: -6.8416 },
  { nom: 'Agadir', lat: 30.4278, lon: -9.5981 },
  { nom: 'Tanger', lat: 35.7595, lon: -5.8340 },
  { nom: 'Fès', lat: 34.0331, lon: -5.0003 },
] as const;

const RAYON_KM = 50;
const MARRAKECH = VILLES[0];

type Lieu = { lat: number; lon: number; label: string };

export default function Decouvrir({ connecte, allerConnexion }: { connecte: boolean; allerConnexion: () => void }) {
  const [lieu, setLieu] = useState<Lieu | null>(null);
  const [format, setFormat] = useState<Format | ''>('');
  const [offres, setOffres] = useState<OffrePublique[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [faits, setFaits] = useState<Set<string>>(new Set());
  const seq = useRef(0); // ignore les réponses périmées quand les filtres changent vite

  const activerGeoloc = () => {
    setLieu(null); // "Localisation en cours…" pendant la résolution
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLieu({ lat: p.coords.latitude, lon: p.coords.longitude, label: 'ma position' }),
        () => {
          toast('Géolocalisation indisponible — Marrakech par défaut', 'erreur');
          setLieu({ ...MARRAKECH, label: MARRAKECH.nom });
        },
        { timeout: 6000, maximumAge: 300_000 },
      );
    } else {
      setLieu({ ...MARRAKECH, label: MARRAKECH.nom });
    }
  };

  // Position réelle au premier chargement
  useEffect(() => { activerGeoloc(); }, []);

  useEffect(() => {
    if (!lieu) return;
    const n = ++seq.current;
    setOffres(null);
    setErr('');
    api.chercher(lieu.lat, lieu.lon, RAYON_KM, format || undefined)
      .then((r) => { if (n === seq.current) setOffres(r as OffrePublique[]); })
      .catch((e) => { if (n === seq.current) setErr((e as Error).message); });
  }, [lieu, format, tick]);

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

  const estMaPosition = lieu?.label === 'ma position';

  return (
    <>
      <p className="section" style={{ marginTop: 6 }}>Où veux-tu jouer ?</p>
      <div className="chips" role="group" aria-label="Lieu">
        <button className="chip" aria-pressed={estMaPosition} onClick={activerGeoloc}>
          <Icone nom="pin" size={14} /> Ma position
        </button>
        {VILLES.map((v) => (
          <button
            key={v.nom}
            className="chip"
            aria-pressed={lieu?.label === v.nom}
            onClick={() => setLieu({ lat: v.lat, lon: v.lon, label: v.nom })}
          >
            {v.nom}
          </button>
        ))}
      </div>

      <div className="chips" role="group" aria-label="Format">
        <button className="chip" aria-pressed={format === ''} onClick={() => setFormat('')}>Tous</button>
        {FORMATS.map((f) => (
          <button key={f} className="chip" aria-pressed={format === f} onClick={() => setFormat(f)}>
            {libelleFormat(f)}
          </button>
        ))}
      </div>

      {err && <Reessayer message={err} surClic={() => setTick((t) => t + 1)} />}
      {!lieu && !err && <Chargement texte="Localisation en cours…" />}
      {lieu && offres === null && !err && <Chargement texte={`Recherche des matchs autour de ${lieu.label}…`} />}
      {offres?.length === 0 && lieu && (
        <Vide
          titre={`Aucun match à moins de ${RAYON_KM} km de ${lieu.label}`}
          hint="Choisis une autre ville, ou lance la partie en proposant ton propre créneau."
        />
      )}
      {offres && offres.length > 0 && lieu && (
        <p className="petit muted" style={{ marginBottom: 10 }}>
          {offres.length} match{offres.length > 1 ? 's' : ''} à moins de {RAYON_KM} km de {lieu.label}
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
