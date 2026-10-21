#!/bin/zsh -l
# Double-clic : démarre le serveur et ouvre la page ordinateur (son actif d'emblée dans Chrome).
# Fermer cette fenêtre Terminal arrête tout.
cd "${0:A:h}"
URL=http://localhost:8081

if ! command -v node >/dev/null; then echo "Node.js introuvable : installer Node puis relancer."; read; exit 1; fi

if curl -s -o /dev/null "$URL"; then
  echo "SEB-MULTIGYRO-BATTERIE tourne déjà."
else
  node serveur.js &
  SERVEUR=$!
  trap 'kill $SERVEUR 2>/dev/null' EXIT HUP INT TERM
  for i in {1..50}; do curl -s -o /dev/null "$URL" && break; sleep 0.1; done
fi

if [ -d "/Applications/Google Chrome.app" ]; then
  # Instance séparée : fenêtre sans barre d'adresse, son autorisé sans clic
  open -na "Google Chrome" --args --app="$URL" --autoplay-policy=no-user-gesture-required \
    --user-data-dir="$HOME/Library/Application Support/SEB-MULTIGYRO-BATTERIE-Chrome" --no-first-run --no-default-browser-check
else
  open "$URL"
fi

if [ -n "$SERVEUR" ]; then
  echo "\n  Fermer cette fenêtre pour arrêter SEB-MULTIGYRO-BATTERIE.\n"
  wait $SERVEUR
fi
