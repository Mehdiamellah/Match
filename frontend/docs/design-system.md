# Design System — « Match de quartier » v2

> Livrable 2/3 — rôle : visual designer. Direction retenue : **dark sportif**.

## Soul de la marque

« Le stade la nuit » : surfaces sombres bleutées (bitume de tunnel, maillot), accent
**lime vaseline** (chasuble d'entraînement fluo) pour l'action, vert stadium pour le
succès, ambre pour l'attente, rouge patch pour le refus. Typo : chiffres condensés
type tableau d'affichage (Barlow Condensed), corps discret (Instrument Sans).

## Tokens (définis dans `src/theme.css`)

| Rôle | Token | Valeur | Usage |
|------|-------|--------|-------|
| Fond page | `--bg` | `#0c1117` | body |
| Surface | `--surface` / `--surface-2` | `#141b23` / `#1a2330` | cartes, feuilles |
| Bordures | `--line` / `--line-strong` | blanc 8% / 16% | séparation douce |
| Action | `--lime` | `#c9f24b` | CTA principal, badge ouvert |
| Succès | `--grass` | `#35d97b` | match confirmé, stats V |
| Attente | `--amber` | `#ffb02e` | demande en attente |
| Refus/erreur | `--red` | `#ff5d5d` | badge refusé, erreurs |
| Info | `--sky` | `#5ec6ff` | distance, localisation |
| Texte | `--text` / `--muted` | `#eef3f7` / `#93a3b1` | prim/sec |
| Typo | `--titre` / `--corps` | Barlow Condensed / Instrument Sans | display / body |
| Rayons | `--radius` / `--radius-sm` | 16 / 10 px | cartes / boutons |

Chaque statut a une variante translucide (`--*-dim`) pour les badges sur fond sombre.

## Comité de composants (CSS uniquement, zéro dépendance)

- `topbar` — logo ⚽ + nom + baseline ; bouton de connexion pour invités.
- `tabbar` — nav fixe 4 onglets, icône + libellé, état actif lime avec halo.
- `carte` — « billet de match » : bloc horaire condensé à gauche (heure géante,
  jour en dessous), perforation de billet, contenu à droite (format, niveau,
  organisateur, distance), badges de statut, action en pied.
- `chip` — filtres (format, rayon) en boutons-pastilles pressables.
- `btn` — `.vert` (lime, plein), `.fantome` (outline), `.rouge` (destructif), `.mini`.
- `badge` — pastilles de statut avec variante `dim`.
- `field` — labels sur inputs sombres (`--surface-2`, focus anneau lime).
- `seg` — segmented control (choix du résultat après-match, onglets auth).
- `sheet` — bottom sheet modal (liste des intéressés), voile + slide-up.
- `toast` — notifications furtives en haut (ok / erreur).
- `stat` — méga-chiffre condensé + libellé (cartes V/N/D du profil).
- `avatar` — initiales sur dégradé, photo si fournie.
- `vide` — empty state : titre court, hint, optionnel CTA.

## Mouvement

Micro-transitions 150 ms, `:active` scale .97, feuille slide-up 220 ms cubic
« finish », toast slide-down. Tout désactivé si `prefers-reduced-motion`.

## Copywriting

Tu rooft, tutoiement systématique. CTA vers l'action verbale (« Je suis
intéressé », « Publier l'offre », « Confirmer ce joueur »). Les erreurs
back-end sont reprises telles quelles (elles sont en français et limpides).
