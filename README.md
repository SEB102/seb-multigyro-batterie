# SEB-MULTIGYRO-BATTERIE

Plusieurs téléphones (iPhone et Android mélangés) servent de baguettes, **chacun avec ses propres sons**. Chaque téléphone apprend 4 gestes (coup **vers le bas**, **vers le haut**, **vers la droite**, **vers la gauche**), et chaque geste joue le son choisi pour ce téléphone. Les sons sortent de l'ordinateur (synthétisés, aucun fichier audio).

Prototype (étude de faisabilité). Petite sœur de [SEB-GYROBATTERIE](https://github.com/SEB102/seb-gyrobatterie) (un seul téléphone).

## Utilisation

**Ordinateur** : ouvrir **https://seb102.github.io/seb-multigyro-batterie/** et cliquer une fois dans la page (le navigateur coupe le son tant qu'on n'a pas cliqué).

**Téléphones** : chacun scanne le QR code affiché. **L'ordinateur et les téléphones doivent être connectés au même réseau Wi-Fi.**
- iPhone : toucher « Toucher pour démarrer » puis autoriser « Mouvement ». Android : démarre tout seul.
- La première fois : **apprentissage des 4 gestes** (15 coups de chacun) ; **l'ordinateur bipe** pour guider (le téléphone ne joue aucun son). Voir « Les 4 gestes ».
- **Écran noir verrouillé** (bouton sur le téléphone) : écran entièrement noir, touchers ignorés, on continue de jouer ; **appui long de 2 s** pour revenir. L'écran reste allumé pendant le jeu.
- **« Voulez-vous fermer l'onglet ? » quand on agite le téléphone** : fonction « Secouer pour annuler » de l'iPhone, à couper dans **Réglages → Accessibilité → Toucher → Secouer pour annuler**.

**Sur l'ordinateur**, chaque téléphone a sa carte : numéro, couleur, un son pour chacun des 4 gestes (le même son peut servir plusieurs fois), sensibilité. Le téléphone affiche son numéro dans sa couleur et le son de chaque geste. Un téléphone connu d'avant les 4 gestes garde ses deux sons pour le bas et le haut ; la droite et la gauche sont complétées. Il garde son identité : après une coupure il retrouve sa place et ses sons. Un téléphone silencieux depuis 4 s est marqué absent.

La sensibilité (80 % par défaut) se règle uniquement sur chaque téléphone ; l'ordinateur l'affiche.

## Sons (11)

Grosse caisse, caisse claire, clap, charleston fermé et ouvert, tom aigu, tom grave, cloche, cymbale, et deux voix « wobble » :
- **Wobble « Hé » (ouvert)** et **Wobble « Ho » (fermé)** : souffle « h » puis voyelle (« é » : formants 400 / 2100 / 2700 Hz ; « o » : 400 / 780 / 2800 Hz), formants qui ondulent à 7 Hz, hauteur qui descend comme une exclamation.

## Version locale (sans Internet, Mac ou Linux)

Double-clic sur `LANCER SEB-MULTIGYRO-BATTERIE.command` : serveur local et fenêtre Chrome avec le son actif. Ports 8081 (ordinateur) et 8444 (téléphones), différents de SEB-GYROBATTERIE : les deux peuvent tourner en même temps. Les téléphones acceptent l'avertissement de certificat la première fois.

## Limites connues

- Wi-Fi public ou d'établissement : il isole souvent les appareils entre eux, la connexion directe échoue. Prévoir son propre routeur.
- Décalage de 10 à 40 ms selon le téléphone.
- Testé avec 10 téléphones simulés ; pas encore avec de vrais téléphones en nombre.

## Déclenchement précoce (toujours actif)

Le coup part **dès que le geste dépasse le seuil**, sans attendre le sommet du geste : environ **78 ms de gagnés** en moyenne (de 33 à 133 ms selon la vitesse du geste ; mesuré dans le navigateur à 60 mesures/s). Ce n'est plus une option : c'est le seul mode, depuis le 21/10/2026. La force du coup est estimée d'après la vitesse et son accélération à cet instant.

## Les 4 gestes (depuis le 21/10/2026)

Le téléphone apprend **4 gestes** : coup **vers le bas**, **vers le haut**, **vers la droite**, **vers la gauche** (les sons choisis sur l'ordinateur pour ce téléphone).

- **Apprentissage** (environ 1 min 30, au premier démarrage, puis bouton « Réapprendre mes gestes ») : 15 coups de chaque geste (10 jusqu'au 21/10/2026 ; 15 réduisent les erreurs d'environ deux tiers en simulation), guidés à l'écran et **au son** joués par l'ordinateur : 1 bip l'écoute commence · un petit bip aigu à chaque coup compté · 2 bips geste enregistré · 3 bips montants terminé. Seuls les coups dans le sens du geste comptent : le retour du poignet n'est ni compté ni appris, et un coup qui déborde sur le geste suivant est ignoré. Les gestes appris restent dans le téléphone et servent aux trois apps (SEB-GYROBATTERIE, SEB-MULTIGYRO-BATTERIE, SEB-SOLOGYRO-BATTERIE).
- **Détection** : sur la vitesse de rotation de tous les axes ; le coup part dès que le seuil est franchi. Un coup est fini dès que la rotation retombe sous le tiers de son sommet (pause minimale 80 ms) ; le rebond du poignet, plus faible et en sens inverse, ne compte pas. Un geste qui ralentit au milieu puis repart dans le même sens (à moins de 45°) sans retour du poignet entre les deux ne compte qu'une fois. Tous les coups détectés jusqu'à 6 par seconde, environ 97 % à 8 par seconde.
- **Reconnaissance** : la forme de la rotation et de l'accélération est comparée aux exemples appris (plus proches voisins, `gestes.js`). Le retour du poignet après un coup vers la droite est un mouvement vers la gauche : il joue le son de la gauche.
- **Attente avant de jouer** : le téléphone affiche la précision obtenue sur tes propres exemples pour 0, 30, 60 et 100 ms, choisit la plus courte qui atteint 95 %, et on peut changer (plus longue = mieux reconnu, mais le son arrive plus tard).
- **Prise en main** : garder la même qu'à l'apprentissage ; varier les coups pendant l'apprentissage (forts, doux, bras haut, bras bas) si on les varie en jouant.
- **Gyroscope obligatoire** : un téléphone sans gyroscope (accéléromètre seul, rare) ne peut plus jouer, l'écran le signale.
- Mesuré sur des gestes simulés : 97 % de gestes reconnus avec 30 ms d'attente ; apprentissage avec des retours aussi rapides que le coup : 40 exemples justes, retours tous écartés. Tests : `node test-gestes.js`.

Historique : jusqu'au 21/10/2026, une calibration de 4 coups (2 vers le haut, 2 vers le bas) apprenait le sens de rotation du poignet, pour 2 sons seulement (grosse caisse en bas, cymbale en haut). Les 4 gestes appris ont d'abord été essayés dans un prototype de SEB-SOLOGYRO-BATTERIE.

## Licence

SEB-MULTIGYRO-BATTERIE · Sébastien Gay · Octobre 2026 · [CC BY-NC 4.0](LICENSE) : partage et adaptation libres en citant l'auteur, sans usage commercial. PeerJS et qrcode-generator gardent leur licence MIT.

## Fichiers

- `index.html` : page ordinateur (QR code, cartes des téléphones, sons, bips) · `telephone.html` : capteur, apprentissage, reconnaissance, envoi
- `gestes.js` : détection et reconnaissance des gestes · `apprentissage.js` : apprentissage guidé · `jeu-gestes.js` : écran du téléphone (apprentissage, attente, jeu), communs aux trois apps
- `liaison.js` : connexion en ligne (WebRTC/PeerJS) ou locale (WebSocket), dans les deux sens
- `detecteur.js` : réglage de sensibilité (et l'ancienne détection, gardée pour ses tests) · `sons.js` : synthèse des 11 sons
- `serveur.js` : serveur de la version locale · `LANCER SEB-MULTIGYRO-BATTERIE.command` : lanceur
- `qrcode.js` (Kazuhiko Arase, MIT) · `peerjs.min.js` (PeerJS 1.5.5, MIT)
- `test-gestes.js` : `node test-gestes.js` (10 tests : détection, reconnaissance, apprentissage) · `test.js` : `node test.js` (57 tests, ancienne détection, sons, serveur)
