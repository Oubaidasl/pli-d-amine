# Classement eFootball · Pli d’Amine

Application React/Vite statique. Le classement est calculé dans le navigateur à partir des résultats Excel, avec SheetJS. Utilisez Node.js 22.12 ou une version plus récente.

```sh
npm ci --allow-remote=all
npm run dev
```

**Données de démonstration — scores fictifs.** Les fichiers `GW1.xlsx` à `GW10.xlsx` fournis contiennent des résultats inventés entre 0 et 5, générés avec la graine `20261125`. Les dix équipes jouent une fois par journée. La saison de démonstration reste ouverte.

## Dossiers publics et portraits

- `public/assets/results/` contient le manifeste, les classeurs de journées, le modèle et l’ancien classeur de classement.
- `public/assets/profiles/` contient les portraits. Pour ajouter ou remplacer une photo, utilisez le nom personnel du joueur dans la colonne `player_name` de l’onglet `Teams`, par exemple `Oubaida Assladday.png`. Les formats PNG, JPG, JPEG et WebP sont acceptés. La casse et les espaces superflus sont ignorés lors de la recherche. Supprimez l’ancien fichier si vous changez son extension.
- Pour un fichier dont le nom est différent ou lorsque plusieurs fichiers correspondent au même joueur, précisez la correspondance dans `src/profile-settings.json`, sous `filesByPlayer`. Exemple fictif : `{"Oubaida Assladday":"portrait-01.webp"}`. La valeur doit être le nom exact du fichier avec son extension. Sans correspondance unique, le site affiche les initiales.
- Laissez `demoPhotos` à `true` tant que des portraits de démonstration sont affichés. Passez-le à `false` après les avoir tous remplacés. Les noms de fichiers sont indexés par Vite en développement et à chaque build.

## Classeur d’une journée

Copiez `public/assets/results/GW_Template.xlsx` dans le même dossier et nommez la copie, par exemple `GW11.xlsx`. Gardez le modèle disponible, car son onglet `Teams` sert de référence pour les noms exacts des équipes, les joueurs et les clubs.

Dans la feuille `Matchweek`, saisissez `GW11` en cellule `B2`. Conservez les en-têtes de la ligne 5. Les colonnes sont identifiées par leur nom.

| En-tête | Format |
| --- | --- |
| `match_id` | Identifiant unique dans la journée, par exemple `M01` à `M05` |
| `home_team` | Nom exact de l’équipe à domicile, choisi dans la liste |
| `home_goals` | Entier positif ou nul dans une cellule numérique |
| `away_goals` | Entier positif ou nul dans une cellule numérique |
| `away_team` | Nom exact de l’équipe à l’extérieur, choisi dans la liste |

Laissez les deux scores vides pour un match à jouer. Un seul score saisi rend la ligne invalide. Une ligne vide d’équipes et de scores est ignorée, même si elle comporte un identifiant prérempli. La clé d’un match associe la journée et `match_id`. Une revanche lors d’une autre journée compte comme un nouveau match. En cas d’identifiant répété dans une journée, toutes ses occurrences sont exclues et les résultats contradictoires sont signalés. Les autres lignes valides restent visibles.

La feuille `Teams` du modèle comporte les en-têtes `tournament_team`, `player_name` et `club` en ligne 1. Le classeur historique `Pli d Amine.xlsx` est conservé et ses statistiques ne participent pas aux calculs.

## Publier une journée ou passer aux résultats réels

1. Enregistrez le classeur dans `public/assets/results/`.
2. Ajoutez son entrée à `public/assets/results/match-weeks.json`, dans l’ordre d’affichage. Par exemple, `{"id":"GW11","label":"Journée 11","file":"GW11.xlsx","complete":false}`.
3. Passez `complete` à `true` après avoir saisi et vérifié les résultats de toute la journée.
4. Pour passer aux résultats réels, remplacez les classeurs fictifs ou retirez leurs entrées du manifeste, puis ajoutez les fichiers réels. Passez `demoData` à `false` une fois que chaque fichier référencé contient uniquement des données réelles.
5. Laissez `seasonComplete` à `false` pendant la saison. Passez-le à `true` lorsque toutes les journées prévues sont publiées, terminées et vérifiées. Les erreurs de chargement ou de validation maintiennent le classement provisoire.

Une victoire vaut 3 points et un nul 1 point. Le tri se fait par points, différence de buts puis buts pour, par ordre décroissant. Les équipes encore à égalité partagent le même rang.

## Régénérer les fichiers fictifs et vérifier le déploiement

```sh
python scripts/generate_demo_weeks.py
npm run build -- --base=/pli-d-amine/
```

Le script écrase les dix fichiers de démonstration à partir du modèle. Utilisez-le uniquement sur les fichiers de démonstration. Il modifie les cellules de la feuille `Matchweek` et conserve les autres éléments du classeur, dont les listes déroulantes, la mise en forme et la feuille `Teams`.

Le workflow GitHub Pages construit avec `--base=./` pour conserver des URL relatives et publie l’intégralité de `dist/`. Vite copie `public/assets/` dans `dist/assets/`, y compris les dossiers `results` et `profiles`. Tout push sur `main` déclenche le workflow, y compris les ajouts, modifications et suppressions dans ces dossiers. Le déclenchement manuel reste disponible.
