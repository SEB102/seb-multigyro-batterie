// Tests : node test.js
const assert = require('assert');
const { creerDetecteur } = require('./detecteur.js');

let ok = 0;
function test(nom, f) {
  try { f(); ok++; console.log('OK  ', nom); }
  catch (e) { console.log('ÉCHEC', nom, '\n     ', e.message); process.exitCode = 1; }
}

// Fabrique un signal échantillonné à 60 Hz à partir de segments [durée ms, fonction(u 0..1) -> °/s]
function signal(segments, hz = 60) {
  const out = []; let t = 0; const dt = 1000 / hz;
  for (const [duree, f] of segments) {
    const n = Math.round(duree / dt);
    for (let i = 0; i < n; i++) { out.push([f(i / n), t]); t += dt; }
  }
  return out;
}
const cloche = (amp) => (u) => amp * Math.sin(Math.PI * u);
const zero = () => 0;
function passer(sig, reglages) {
  const d = creerDetecteur(reglages);
  return sig.map(([v, t]) => d.traiter(v, t)).filter(Boolean);
}

test('coup vers le bas → une grosse caisse', () => {
  const ev = passer(signal([[100, zero], [120, cloche(-800)], [200, zero]]));
  assert.deepStrictEqual(ev.map(e => e.type), ['grosse-caisse']);
});

test('coup vers le haut → une cymbale', () => {
  const ev = passer(signal([[100, zero], [120, cloche(800)], [200, zero]]));
  assert.deepStrictEqual(ev.map(e => e.type), ['cymbale']);
});

test('rebond du poignet après la grosse caisse → pas de cymbale fantôme', () => {
  const ev = passer(signal([[50, zero], [120, cloche(-900)], [100, cloche(450)], [200, zero]]));
  assert.deepStrictEqual(ev.map(e => e.type), ['grosse-caisse']);
});

test('inclinaison lente → rien', () => {
  const ev = passer(signal([[1000, cloche(-150)], [1000, cloche(200)]]));
  assert.strictEqual(ev.length, 0);
});

test('deux grosses caisses à 250 ms d\'écart → deux coups', () => {
  const ev = passer(signal([[50, zero], [120, cloche(-700)], [130, zero], [120, cloche(-700)], [100, zero]]));
  assert.deepStrictEqual(ev.map(e => e.type), ['grosse-caisse', 'grosse-caisse']);
});

test('grosse caisse puis cymbale à 400 ms → les deux', () => {
  const ev = passer(signal([[50, zero], [120, cloche(-700)], [280, zero], [120, cloche(700)], [100, zero]]));
  assert.deepStrictEqual(ev.map(e => e.type), ['grosse-caisse', 'cymbale']);
});

test('la force suit la vitesse du geste et reste dans 0..1', () => {
  const f = (amp) => passer(signal([[50, zero], [120, cloche(amp)], [100, zero]]))[0].force;
  const faible = f(-400), moyen = f(-700), fort = f(-3000);
  assert.ok(faible < moyen && moyen < fort, `${faible} ${moyen} ${fort}`);
  assert.ok(faible > 0 && fort === 1);
});

test('déclenché au sommet du geste (latence < 1 échantillon après le pic)', () => {
  const sig = signal([[50, zero], [120, cloche(-800)], [100, zero]]);
  const d = creerDetecteur();
  let tCoup = null;
  for (const [v, t] of sig) if (d.traiter(v, t)) { tCoup = t; break; }
  const tPic = sig.reduce((a, b) => (Math.abs(b[0]) > Math.abs(a[0]) ? b : a))[1];
  assert.ok(tCoup !== null && tCoup - tPic <= 2 * 1000 / 60, `pic ${tPic} coup ${tCoup}`);
});

test('valeurs absentes (null/NaN) ignorées sans planter', () => {
  const d = creerDetecteur();
  assert.strictEqual(d.traiter(null, 0), null);
  assert.strictEqual(d.traiter(NaN, 10), null);
});

test('le geste continue sans rien redéclencher tant qu\'on n\'est pas revenu au calme', () => {
  // coup avec une vitesse qui oscille au-dessus du seuil
  const ev = passer(signal([[50, zero], [300, (u) => -500 - 300 * Math.sin(6 * Math.PI * u)], [100, zero]]));
  assert.strictEqual(ev.length, 1);
});

// ---- Calibration : 3 coups vers le bas, quelle que soit la façon dont le navigateur les rapporte ----
const { calibrer } = require('./detecteur.js');
let graine = 1; const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647) - 0.5;
// geste(u) -> valeur sur l'axe principal pour un coup ; les autres axes reçoivent un peu du mouvement + bruit
function seance(geste, { axe = 1, echelle = 1, bruit = 5, coups = 3, duree = 160, autres = 0.25 } = {}) {
  const segs = [[300, zero]];
  for (let i = 0; i < coups; i++) segs.push([duree, geste], [500, zero]);
  return signal(segs).map(([v, t]) => {
    const axes = [0, 0, 0].map(() => hasard() * bruit * echelle);
    axes[axe] += v * echelle;
    axes[(axe + 1) % 3] += v * autres * echelle;
    return { t, axes };
  });
}
// Rejoue une séance calibrée dans le détecteur
function rejouer(ech, cal) {
  const d = creerDetecteur();
  return ech.map((e) => d.traiter(e.axes[cal.axe] * cal.signe * cal.facteur, e.t)).filter(Boolean).map((e) => e.type);
}
const coupGyro = (amp) => (u) => (u < 0.6 ? amp * Math.sin(Math.PI * u / 0.6) : -0.4 * amp * Math.sin(Math.PI * (u - 0.6) / 0.4)); // coup + rebond

const configurations = [
  ['gyroscope en °/s, axe X (Chrome Android / spec récente)', seance(coupGyro(-800), { axe: 0 })],
  ['gyroscope en °/s, axe Y, sens positif vers le bas (autre convention)', seance(coupGyro(800), { axe: 1 })],
  ['gyroscope en rad/s (navigateurs anciens)', seance(coupGyro(-800), { axe: 0, echelle: Math.PI / 180 })],
  ['accéléromètre seul, arrêt brusque plus fort que l\'élan', seance((u) => (u < 0.5 ? -12 * Math.sin(Math.PI * u / 0.5) : 30 * Math.sin(Math.PI * (u - 0.5) / 0.5)), { axe: 2, bruit: 0.3 })],
  ['coups faibles et irréguliers', seance((u) => -350 * Math.sin(Math.PI * u), { axe: 0, coups: 4, bruit: 15 })],
];
for (const [nom, ech] of configurations) {
  test(`calibration : ${nom} → les coups vers le bas donnent la grosse caisse`, () => {
    const cal = calibrer(ech);
    assert.ok(cal, 'calibration impossible');
    const sons = rejouer(ech, cal);
    assert.ok(sons.length >= 3 && sons.every((s) => s === 'grosse-caisse'), sons.join(','));
  });
}

test('calibration : le même geste vers le haut donne la cymbale', () => {
  const bas = seance(coupGyro(-800), { axe: 1 });
  const cal = calibrer(bas);
  const haut = seance(coupGyro(800), { axe: 1 });
  const sons = rejouer(haut, cal);
  assert.ok(sons.length >= 3 && sons.every((s) => s === 'cymbale'), sons.join(','));
});

test('calibration : téléphone immobile ou un seul coup → refusée', () => {
  assert.strictEqual(calibrer(seance(zero, { coups: 3 })), null);
  assert.strictEqual(calibrer(seance(coupGyro(-800), { coups: 1 })), null);
  assert.strictEqual(calibrer([]), null);
});

// ---- Alternance : chaque coup, dans n'importe quel sens, alterne grosse caisse / cymbale ----
test('alternance : bas, bas, haut, bas, haut → GC, CY, GC, CY, GC (rebonds non comptés)', () => {
  const { creerAlternance } = require('./detecteur.js');
  const prochain = creerAlternance();
  const sig = signal([[50, zero], [160, coupGyro(-800)], [400, zero], [160, coupGyro(-800)], [400, zero],
    [160, coupGyro(800)], [400, zero], [160, coupGyro(-600)], [400, zero], [160, coupGyro(900)], [300, zero]]);
  const sons = passer(sig).map(() => prochain());
  assert.deepStrictEqual(sons, ['grosse-caisse', 'cymbale', 'grosse-caisse', 'cymbale', 'grosse-caisse']);
});

// ---- Sons : les 11 instruments, dont les deux voix wobble, se jouent sans erreur ----
test('sons : 11 instruments dont « Hé » (ouvert) et « Ho » (fermé), joués sans erreur', () => {
  // Faux Web Audio : chaque nœud accepte tout (connect, start, rampes…)
  const noeud = () => new Proxy(function () {}, {
    get: (t, k) => (k === 'connect' ? (x) => x : typeof k === 'string' && /Ramp|setValue|start|stop/.test(k) ? () => {} : noeud()),
    set: () => true, apply: () => noeud(),
  });
  const ctx = { currentTime: 0, sampleRate: 48000, destination: noeud(), createDynamicsCompressor: noeud, createOscillator: noeud,
    createGain: noeud, createBiquadFilter: noeud, createBufferSource: noeud, createBuffer: (c, l) => ({ getChannelData: () => new Float32Array(l) }) };
  const bac = {}; require('vm').runInNewContext(require('fs').readFileSync(__dirname + '/sons.js', 'utf8'), bac);
  const { instruments } = bac.creerSons(ctx);
  assert.strictEqual(Object.keys(instruments).length, 11);
  assert.ok(instruments['Wobble « Hé » (ouvert)'] && instruments['Wobble « Ho » (fermé)']);
  for (const f of Object.values(instruments)) { f(0); f(1); }
});

// ---- Serveur : relais téléphone → ordinateur ----
(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { demarrer } = require('./serveur.js');
  const serveur = await demarrer(0, { portHttp: 0, silencieux: true });
  const port = serveur.https.address().port, portHttp = serveur.http.address().port;
  const ouvrir = (url) => new Promise((res, rej) => {
    const ws = new WebSocket(url);
    ws.onopen = () => res(ws); ws.onerror = rej;
  });
  try {
    // ordinateur en http://localhost (pas de certificat), téléphone en https
    const ordi = await ouvrir(`ws://127.0.0.1:${portHttp}/ws?role=ordinateur`);
    const tel = await ouvrir(`wss://localhost:${port}/ws?role=telephone`);
    const recu = new Promise((res) => { ordi.onmessage = (m) => { const d = JSON.parse(m.data); if (d.coup) res(d); }; });
    const message = { coup: 'cymbale', force: 0.42, longTexte: 'x'.repeat(300) }; // > 125 octets : trame longue
    tel.send(JSON.stringify(message));
    const r = await Promise.race([recu, new Promise((_, rej) => setTimeout(() => rej(new Error('rien reçu')), 2000))]);
    assert.deepStrictEqual(r, message);
    ok++; console.log('OK   serveur : message du téléphone relayé à l\'ordinateur (HTTPS + WebSocket)');

    // Sens inverse : réglage envoyé par l'ordinateur, reçu par tous les téléphones
    const tel2 = await ouvrir(`wss://localhost:${port}/ws?role=telephone`);
    const attendre = (ws) => Promise.race([
      new Promise((res) => { ws.onmessage = (m) => res(JSON.parse(m.data)); }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('rien reçu par un téléphone')), 2000)),
    ]);
    const reglage = { reglage: { seuil: 330 }, pour: 'tel-abc' };
    const recus = Promise.all([attendre(tel), attendre(tel2)]);
    ordi.send(JSON.stringify(reglage));
    for (const r of await recus) assert.deepStrictEqual(r, reglage);
    tel2.close();
    ok++; console.log('OK   serveur : message de l\'ordinateur relayé à tous les téléphones');

    const page = await fetch(`https://localhost:${port}/telephone.html`);
    assert.strictEqual(page.status, 200);
    const interdit = await fetch(`https://localhost:${port}/../serveur.js`);
    assert.notStrictEqual(interdit.status, 200);
    ok++; console.log('OK   serveur : pages servies, sortie du dossier refusée');

    const accueil = await fetch(`http://127.0.0.1:${portHttp}/`);
    assert.strictEqual(accueil.status, 200);
    assert.strictEqual((await fetch(`http://127.0.0.1:${portHttp}/qrcode.js`)).status, 200);
    const adresses = await (await fetch(`http://127.0.0.1:${portHttp}/adresses`)).json();
    assert.ok(adresses.every((a) => a === `https://${a.split('/')[2].split(':')[0]}:${port}/telephone.html`), adresses.join());
    ok++; console.log('OK   serveur : page ordinateur en http local, adresse téléphone en https');

    const { X509Certificate } = require('crypto');
    const san = new X509Certificate(require('fs').readFileSync(__dirname + '/cert.pem')).subjectAltName;
    for (const a of adresses) assert.ok(san.includes('IP Address:' + a.split('/')[2].split(':')[0]), san);
    ok++; console.log('OK   certificat valable pour l\'adresse Wi-Fi actuelle');

    // Règles Apple : sinon Safari iPhone refuse la connexion sans proposer de continuer
    const c = new X509Certificate(require('fs').readFileSync(__dirname + '/cert.pem'));
    const jours = (Date.parse(c.validTo) - Date.parse(c.validFrom)) / 86400000;
    assert.ok(jours <= 825, `validité ${jours} jours`);
    assert.ok((c.keyUsage || []).includes('1.3.6.1.5.5.7.3.1'), 'usage serverAuth absent');
    assert.ok(c.publicKey.asymmetricKeyDetails.modulusLength >= 2048);
    assert.ok(/sha256/i.test(require('child_process').execFileSync('openssl', ['x509', '-in', __dirname + '/cert.pem', '-noout', '-text']).toString()));
    ok++; console.log('OK   certificat conforme aux règles Apple (≤ 825 jours, serverAuth, RSA 2048, SHA-256)');
    tel.close(); ordi.close();
  } catch (e) {
    console.log('ÉCHEC serveur\n     ', e.message); process.exitCode = 1;
  }
  serveur.close();
  console.log(`\n${ok} tests réussis${process.exitCode ? ' — DES ÉCHECS' : ''}`);
  process.exit(process.exitCode || 0);
})();
