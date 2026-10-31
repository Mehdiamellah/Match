// Shell : barre du haut, écran courant, tab bar 4 onglets, toasts.
import { useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import type { Profil } from './types';
import { Icone, Toasts, toast, Chargement, type IconeNom } from './ui';
import Auth from './screens/Auth';
import Decouvrir from './screens/Decouvrir';
import Proposer from './screens/Proposer';
import Demandes from './screens/Demandes';
import EcranProfil from './screens/Profil';

type Route = 'decouvrir' | 'proposer' | 'demandes' | 'profil';

const ONGLETS: { id: Route; libelle: string; icone: IconeNom; protege?: boolean }[] = [
  { id: 'decouvrir', libelle: 'Découvrir', icone: 'chercher' },
  { id: 'proposer', libelle: 'Proposer', icone: 'eclair', protege: true },
  { id: 'demandes', libelle: 'Demandes', icone: 'demandes', protege: true },
  { id: 'profil', libelle: 'Profil', icone: 'profil', protege: true },
];

export default function App() {
  const [route, setRoute] = useState<Route>('decouvrir');
  const [user, setUser] = useState<Profil | null>(null);
  const [boot, setBoot] = useState(() => Boolean(getToken()));
  const [authOuvert, setAuthOuvert] = useState(false);

  useEffect(() => {
    if (!getToken()) { setBoot(false); return; }
    api.profilMoi()
      .then((r) => setUser(r as unknown as Profil))
      .catch(() => setToken(null)) // token expiré → invité
      .finally(() => setBoot(false));
  }, []);

  const connecter = (p: Profil) => {
    setUser(p);
    setAuthOuvert(false);
    toast(`Bienvenue ${p.nom.split(' ')[0]} ! ⚽`);
  };

  const deconnecter = () => {
    setToken(null);
    setUser(null);
    setRoute('decouvrir');
    toast('Déconnecté. À bientôt sur le terrain 👋');
  };

  const connecte = user !== null;
  const ongletProtege = ONGLETS.find((o) => o.id === route)?.protege ?? false;
  const montrerAuth = !connecte && (authOuvert || ongletProtege);

  let contenu: ReactNode;
  if (boot) {
    contenu = <Chargement texte="Reprise de ta session…" />;
  } else if (montrerAuth) {
    contenu = <Auth surConnexion={connecter} />;
  } else {
    switch (route) {
      case 'decouvrir':
        contenu = <Decouvrir connecte={connecte} allerConnexion={() => setAuthOuvert(true)} />;
        break;
      case 'proposer':
        contenu = <Proposer />;
        break;
      case 'demandes':
        contenu = <Demandes />;
        break;
      case 'profil':
        contenu = <EcranProfil surDeconnexion={deconnecter} />;
        break;
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="boule" aria-hidden>⚽</span>
        <div>
          <h1>Match de quartier</h1>
          <p className="baseline">Trouve des joueurs, fixe un créneau, joue.</p>
        </div>
        {!boot && !montrerAuth && !connecte && (
          <button className="btn mini vert pousse" onClick={() => setAuthOuvert(true)}>Connexion</button>
        )}
        {!boot && !montrerAuth && connecte && (
          <button className="btn mini fantome pousse" onClick={() => setRoute('profil')}>Mon profil</button>
        )}
      </header>

      {contenu}

      {!boot && (
        <nav className="tabbar" aria-label="Navigation principale">
          {ONGLETS.map((o) => (
            <button key={o.id} className="tab" aria-current={route === o.id} onClick={() => setRoute(o.id)}>
              <Icone nom={o.icone} />
              <span>{o.libelle}</span>
            </button>
          ))}
        </nav>
      )}

      <Toasts />
    </div>
  );
}
