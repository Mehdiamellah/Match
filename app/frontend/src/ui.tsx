// Mini bibliothèque d'interface : icônes, toasts, feuille, avatar, états vides.
import { useEffect, useState, type ReactNode } from 'react';

/* ── Icônes (SVG inline, la couleur suit currentColor) ─────────── */

export type IconeNom =
  | 'chercher' | 'eclair' | 'demandes' | 'profil' | 'pin' | 'tel'
  | 'bulle' | 'boucle' | 'horloge' | 'fermer' | 'trophee';

export function Icone({ nom, size = 22 }: { nom: IconeNom; size?: number }) {
  const commun = {
    width: size, height: size, viewBox: '0 0 24 24' as const, fill: 'none' as const,
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (nom) {
    case 'chercher':
      return (
        <svg {...commun}><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5l-4.2-4.2" /></svg>
      );
    case 'eclair':
      return (
        <svg {...commun}><path d="M13 2L4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2z" /></svg>
      );
    case 'demandes':
      return (
        <svg {...commun}><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 21a2.2 2.2 0 004 0" /></svg>
      );
    case 'profil':
      return (
        <svg {...commun}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.4-4 4.6-5.5 8-5.5s6.6 1.5 8 5.5" /></svg>
      );
    case 'pin':
      return (
        <svg {...commun}><path d="M12 21.5S5 15.7 5 10a7 7 0 1114 0c0 5.7-7 11.5-7 11.5z" /><circle cx="12" cy="10" r="2.6" /></svg>
      );
    case 'tel':
      return (
        <svg {...commun}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.7 19.7 0 01-8.6-3A19.4 19.4 0 015.1 13 19.7 19.7 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7 12.9 12.9 0 00.7 2.8 2 2 0 01-.5 2.1L8.1 9.9a16.3 16.3 0 006 6l1.3-1.2a2 2 0 012.1-.5 12.9 12.9 0 002.8.7 2 2 0 011.7 2z" /></svg>
      );
    case 'bulle':
      return (
        <svg {...commun}><path d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" /></svg>
      );
    case 'boucle':
      return (
        <svg {...commun}><path d="M21 12a9 9 0 11-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
      );
    case 'horloge':
      return (
        <svg {...commun}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      );
    case 'fermer':
      return (
        <svg {...commun}><path d="M6 6l12 12M18 6L6 18" /></svg>
      );
    case 'trophee':
      return (
        <svg {...commun}><path d="M8 21h8M12 17v4" /><path d="M7 4h10v5a5 5 0 01-10 0V4z" /><path d="M7 6H4a3.2 3.2 0 003.2 3.6M17 6h3a3.2 3.2 0 01-3.2 3.6" /></svg>
      );
  }
}

/* ── Toasts ────────────────────────────────────────────────────── */

type ToastItem = { id: number; texte: string; genre: 'ok' | 'erreur' };
let pousseToast: ((t: ToastItem) => void) | null = null;

export function toast(texte: string, genre: 'ok' | 'erreur' = 'ok') {
  pousseToast?.({ id: Date.now() + Math.random(), texte, genre });
}

export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pousseToast = (t) => {
      setItems((x) => [...x, t]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 4000);
    };
    return () => { pousseToast = null; };
  }, []);
  return (
    <div className="toasts" role="status">
      {items.map((t) => <div key={t.id} className={`toast ${t.genre === 'erreur' ? 'erreur' : ''}`}>{t.texte}</div>)}
    </div>
  );
}

/* ── Feuille (bottom sheet) ────────────────────────────────────── */

export function Feuille({ titre, fermer, children }: { titre: string; fermer: () => void; children: ReactNode }) {
  return (
    <div className="voile" onClick={fermer}>
      <div className="panneau" onClick={(e) => e.stopPropagation()}>
        <div className="poignee" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h3 style={{ flex: 1 }}>{titre}</h3>
          <button className="btn mini" onClick={fermer} aria-label="Fermer" style={{ padding: '7px 9px' }}>
            <Icone nom="fermer" size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Avatar (initiales ou photo) ───────────────────────────────── */

import { initiales } from './util';

export function Avatar({ nom, photo, plein = false }: { nom: string; photo?: string | null; plein?: boolean }) {
  return (
    <div className={`avatar ${plein ? 'plein' : ''}`} title={nom}>
      {photo ? <img src={photo} alt={nom} /> : initiales(nom)}
    </div>
  );
}

/* ── États (vide / chargement / erreur réessayable) ────────────── */

export function Vide({ icone = 'horloge', titre, hint, action }: {
  icone?: IconeNom; titre: string; hint?: string; action?: ReactNode;
}) {
  return (
    <div className="vide">
      <div className="icon"><Icone nom={icone} size={36} /></div>
      <strong>{titre}</strong>
      {hint && <div className="petit">{hint}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return <div className="chargement">{texte}</div>;
}

export function Reessayer({ message, surClic }: { message: string; surClic: () => void }) {
  return (
    <div className="vide">
      <div className="icon"><Icone nom="boucle" size={32} /></div>
      <strong>Oups…</strong>
      <div className="petit">{message}</div>
      <button className="btn mini" style={{ marginTop: 12 }} onClick={surClic}>Réessayer</button>
    </div>
  );
}
