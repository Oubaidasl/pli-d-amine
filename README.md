# Classement eFootball · Pli d’Amine

Application React statique développée avec Vite. Utilisez Node.js 22.12 ou une version plus récente.

```sh
npm install --allow-remote=all
npm run dev
```

SheetJS est installé depuis son [CDN officiel](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/). L’option `--allow-remote=all` autorise cette installation sur les versions récentes de npm.

## Mettre à jour le classement

Remplacez `public/assets/Pli d Amine.xlsx` en conservant le nom du fichier. La première ligne de la première feuille contient les en-têtes, dans l’ordre de votre choix.

| Donnée | En-tête Excel |
| --- | --- |
| Identité | Nom, Prénom, Nom d'équipe, Équipe de base |
| MJ, V, N, D | Nombre de matchs, W, D, L |
| Pts, BP, BC, Diff | PTS, GOALS, TMARKA FIH, (+-) |

Enregistrez le classeur après le recalcul des formules dans Excel pour que leurs résultats soient présents dans le fichier. Le classement trie les joueurs par points, différence de buts et buts marqués, dans l’ordre décroissant à chaque critère.

Pour générer la version statique, lancez `npm run build`. Vite copie le classeur dans `dist/assets/`. Sur un hébergement statique déjà en place, remplacez directement `assets/Pli d Amine.xlsx` dans les fichiers servis.

## Évolutions prévues

- Lire des fichiers de journées tels que `GW1.xlsx` et calculer le classement à partir des scores individuels. Calculer les victoires, les matchs nuls, les défaites, les points (3 pour une victoire, 1 pour un nul), les buts pour, les buts contre, la différence de buts et les matchs joués.
- Afficher les résultats et le calendrier des journées.
- Afficher les équipes qualifiées et le tableau de la phase finale au format Kings League. La première équipe accède directement aux demi-finales. Les équipes classées de la 2e à la 7e place disputent trois quarts de finale. Les trois vainqueurs rejoignent la première équipe en demi-finales.
