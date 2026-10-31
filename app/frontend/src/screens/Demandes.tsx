// Mes demandes : envoyées par moi, avec le contact débloqué si confirmé.
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { MaDemande } from '../types';
import { jour, heure, libelleFormat, whatsappLien } from '../util';
import { Icone, Avatar, Vide, Chargement, Reessayer } from '../ui';

const SECTIONS: { statut: MaDemande['statut']; titre: string }[] = [
  { statut: 'CONFIRME', titre: 'Confirmés ⚽' },
  { statut: 'EN_ATTENTE', titre: 'En attente de réponse' },
  { statut: 'REFUSE', titre: 'Refusés' },
];

export default function Demandes() {
  const [demandes, setDemandes] = useState<MaDemande[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setErr('');
    api.mesDemandes()
      .then((r) => setDemandes(r as MaDemande[]))
      .catch((e) => setErr((e as Error).message));
  }, [tick]);

  return (
    <>
      <h2 className="section" style={{ marginTop: 6 }}>Mes demandes</h2>
      {err && <Reessayer message={err} surClic={() => setTick((t) => t + 1)} />}
      {demandes === null && !err && <Chargement texte="Chargement de tes demandes…" />}
      {demandes?.length === 0 && (
        <Vide
          icone="eclair"
          titre="Aucune demande envoyée"
          hint="Fais un tour dans Découvrir : les organisateurs attendent peut-être ta réponse."
          action={null}
        />
      )}

      {SECTIONS.map(({ statut, titre }) => {
        const groupe = demandes?.filter((d) => d.statut === statut)
          .sort((a, b) => new Date(a.offre.debut).getTime() - new Date(b.offre.debut).getTime()) ?? [];
        if (groupe.length === 0) return null;
        return (
          <div key={statut}>
            <h2 className="section">{titre}</h2>
            <div className="grille">
            {groupe.map((d) => (
              <article className="carte" key={d.id}>
                <div className="heure">
                  <strong>{heure(d.offre.debut)}</strong>
                  <span>{jour(d.offre.debut)}</span>
                </div>
                <div className="corps">
                  <h3>{libelleFormat(d.offre.format)} · {d.createur.nom}</h3>
                  <p className="meta">
                    {d.offre.niveauPrefere ? `${d.offre.niveauPrefere} · ` : ''}
                    Jusqu'à {heure(d.offre.fin)} · organisateur {d.createur.nom}
                  </p>
                  <div className="pied">
                    {d.statut === 'CONFIRME' && (
                      <span className="badge succes">
                        <Icone nom="trophee" size={13} /> Contact débloqué
                      </span>
                    )}
                    {d.statut === 'EN_ATTENTE' && (
                      <span className="badge jaune">En attente de confirmation</span>
                    )}
                    {d.statut === 'REFUSE' && <span className="badge rouge">Refusée</span>}
                    {d.statut === 'CONFIRME' && d.createur.telephone ? (
                      <span className="contacts" style={{ marginLeft: 'auto' }}>
                        <a href={`tel:${d.createur.telephone}`}>
                          <Icone nom="tel" size={14} /> Appeler
                        </a>
                        <a href={whatsappLien(d.createur.telephone)} target="_blank" rel="noreferrer">
                          <Icone nom="bulle" size={14} /> WhatsApp
                        </a>
                      </span>
                    ) : null}
                  </div>
                  {d.statut === 'EN_ATTENTE' && (
                    <p className="petit muted" style={{ margin: '8px 0 0' }}>
                      <Avatar nom={d.createur.nom} photo={d.createur.photo} />
                      <span style={{ display: 'block', marginTop: -40, marginLeft: 50 }}>
                        Quand {d.createur.nom.split(' ')[0]} confirme, son numéro apparaît ici et le vôtre chez lui.
                      </span>
                    </p>
                  )}
                </div>
              </article>
            ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
