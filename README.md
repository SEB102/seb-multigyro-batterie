# SEB-MULTIGYRO-BATTERIE

Plusieurs téléphones (iPhone et Android mélangés) servent de baguettes, **chacun avec ses propres sons**. Un coup **vers le sol** joue le premier son du téléphone, un coup **vers le plafond** le second, quelle que soit la tenue du téléphone. Les sons sortent de l'ordinateur (synthétisés, aucun fichier audio).

Prototype (étude de faisabilité). Petite sœur de [SEB-GYROBATTERIE](https://github.com/SEB102/seb-gyrobatterie) (un seul téléphone).

## Utilisation

**Ordinateur** : ouvrir **https://seb102.github.io/seb-multigyro-batterie/** et cliquer une fois dans la page (le navigateur coupe le son tant qu'on n'a pas cliqué).

**Téléphones** : chacun scanne le QR code affiché. **L'ordinateur et les téléphones doivent être connectés au même réseau Wi-Fi.**
- iPhone : toucher « Toucher pour démarrer » puis autoriser « Mouvement ». Android : démarre tout seul.
- La première fois : **donner 3 coups secs**, comme avec une baguette, dans n'importe quel sens (calibration). Chaque coup reconnu s'affiche (● ○ ○), et c'est fini dès le 3e. Puis jouer.

**Sur l'ordinateur**, chaque téléphone a sa carte : numéro, couleur, son « vers le sol », son « vers le plafond » (mettre deux fois le même pour un son fixe), sensibilité. Le téléphone affiche son numéro et ses sons dans sa couleur. Il garde son identité : après une coupure il retrouve sa place et ses sons. Un téléphone silencieux depuis 4 s est marqué absent.

La sensibilité se règle uniquement sur chaque téléphone ; l'ordinateur l'affiche.

## Sons (11)

Grosse caisse, caisse claire, clap, charleston fermé et ouvert, tom aigu, tom grave, cloche, cymbale, et deux voix « wobble » :
- **Wobble « Hé » (ouvert)** et **Wobble « Ho » (fermé)** : souffle « h » puis voyelle (« é » : formants 400 / 2100 / 2700 Hz ; « o » : 400 / 780 / 2800 Hz), formants qui ondulent à 7 Hz, hauteur qui descend comme une exclamation.

## Version locale (sans Internet, Mac ou Linux)

Double-clic sur `LANCER SEB-MULTIGYRO-BATTERIE.command` : serveur local et fenêtre Chrome avec le son actif. Ports 8081 (ordinateur) et 8444 (téléphones), différents de SEB-GYROBATTERIE : les deux peuvent tourner en même temps. Les téléphones acceptent l'avertissement de certificat la première fois.

## Limites connues

- Wi-Fi public ou d'établissement : il isole souvent les appareils entre eux, la connexion directe échoue. Prévoir son propre routeur.
- Décalage de 10 à 40 ms selon le téléphone.
- Testé avec 10 téléphones simulés ; pas encore avec de vrais téléphones en nombre.

## Déclenchement précoce

Case à cocher sur le téléphone : le coup part **dès que le geste dépasse le seuil**, au lieu d'attendre le sommet du geste. La force du coup est alors estimée d'après la vitesse et son accélération à cet instant (un peu moins fidèle). Le téléphone mesure à chaque coup le temps gagné et affiche la moyenne.

Mesures (navigateur, gestes simulés à 60 mesures/s) : environ **78 ms de gagnés** en moyenne (de 33 à 133 ms selon la vitesse du geste ; plus le geste est lent, plus le gain est grand). Désactivée par défaut : le mode « sommet » reste inchangé.

## Grosse caisse en bas, cymbale en haut (3D)

C'est le **sens du coup dans la pièce** qui décide : un coup qui part **vers le sol** joue le premier son du téléphone, un coup **vers le plafond** le second, quelle que soit la façon de tenir le téléphone (bras levé et téléphone pointé vers le haut, un coup vers le bas reste une grosse caisse). Le téléphone projette sa propre accélération sur la direction de la gravité et en déduit la vitesse verticale du geste (`creerVerticale` dans `detecteur.js`) ; le moment du coup reste donné par le gyroscope. Testé dans 7 inclinaisons du téléphone, avec les deux conventions de signe des navigateurs, et sur les téléphones sans mesure d'accélération « sans gravité ».

**Le bout de la « baguette ».** Mesurer seulement le mouvement du téléphone ne suffit pas : quand le bras tourne vite, le téléphone est tiré vers le coude (effet « manège »), ce qui faisait lire « vers le bas » un coup vers le haut donné bras levé (constaté sur iPhone le 21/10/2026). La calibration apprend donc aussi **quel axe du téléphone sert de baguette** (celui dont la rotation produit le mouvement le plus vertical : le long du téléphone s'il est tenu comme une baguette, en travers s'il est tenu debout dans le poing). À chaque coup, le sens vient de la vitesse du bout de cette baguette : instantané, sans dérive. Une calibration faite avant cette correction est refaite automatiquement une fois. Vérifié sur de vraies mesures d'iPhone (`mesures-iphone.json`) : 24 coups sur 25 dans le sens du geste, contre presque tous en grosse caisse avant.

## Licence

SEB-MULTIGYRO-BATTERIE · Sébastien Gay · Octobre 2026 · [CC BY-NC 4.0](LICENSE) : partage et adaptation libres en citant l'auteur, sans usage commercial. PeerJS et qrcode-generator gardent leur licence MIT.

## Fichiers

- `index.html` : page ordinateur (QR code, cartes des téléphones, sons) · `telephone.html` : capteur, calibration, détection, envoi
- `liaison.js` : connexion en ligne (WebRTC/PeerJS) ou locale (WebSocket), dans les deux sens
- `detecteur.js` : détection des coups, calibration, sens 3D · `sons.js` : synthèse des 11 sons
- `serveur.js` : serveur de la version locale · `LANCER SEB-MULTIGYRO-BATTERIE.command` : lanceur
- `qrcode.js` (Kazuhiko Arase, MIT) · `peerjs.min.js` (PeerJS 1.5.5, MIT)
- `test.js` : `node test.js`
