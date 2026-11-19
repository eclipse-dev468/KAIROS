// KAIROS - Server
// di Andrea / ECLIPSE - Assistente vocale personale
// Il tuo momento.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4173;

app.use(express.json());
app.use(express.static(__dirname));

// --- CONFIG ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const MEMORIA_FILE = path.join(DATA_DIR, 'KAIROS-MEMORIA.md');
if (!fs.existsSync(MEMORIA_FILE)) {
  fs.writeFileSync(MEMORIA_FILE, `# KAIROS - MEMORIA

## Chi è Andrea
- Nome: Andrea, 14 anni, liceo scientifico sportivo
- Alter-ego: ECLIPSE
- Progetto: SFIDACUGINI, gioco di calcio con cugino Alberto, da finire per Natale 25 dicembre
- Sogno: entrare nella nazionale di judo e arrivare a 【entity-Konami¦canonical_name=Konami】
- Preferenze: lavorare di sera, programmare fino alle 00:00

## Cose da ricordare
- Padre: programmatore, vuole che Andrea vada bene a scuola. Venerdi ha verifica di italiano.
- Cugino: Alberto, n.7, Andrea e n.10
- Simbolo SFIDACUGINI: fulmine a doppia saetta bianco-blu-nero

## Conversazioni
`);
}

// --- MEMORIA ---
function leggiMemoria() {
  return fs.readFileSync(MEMORIA_FILE, 'utf-8');
}
function salvaMemoria(nuovoTesto) {
  const vecchia = leggiMemoria();
  const aggiornata = vecchia + `\n- [${new Date().toLocaleString('it-IT')}] ${nuovoTesto}\n`;
  fs.writeFileSync(MEMORIA_FILE, aggiornata);
  return aggiornata;
}

// --- CALENDARIO ---
function leggiCalendario() {
  const file = path.join(DATA_DIR, 'calendario.txt');
  if (!fs.existsSync(file)) return "Nessun evento salvato. Puoi dirmi: aggiungi palestra domani alle 18";
  return fs.readFileSync(file, 'utf-8');
}
function aggiungiEvento(testo) {
  const file = path.join(DATA_DIR, 'calendario.txt');
  fs.appendFileSync(file, testo + "\n");
}

// --- CALCOLI SENZA AI ---
function provaCalcolo(testo) {
  const t = testo.toLowerCase();
  if (t.includes('quanto fa') || t.includes('calcola')) {
    try {
      let expr = t.replace('quanto fa','').replace('calcola','').replace('?','')
        .replace('per','*').replace('x','*').replace('diviso','/').replace(',','.');
      if (/^[0-9\s\+\-\*\/\.\(\)\%]+$/.test(expr)) {
        const ris = eval(expr);
        return `Fa ${ris}.`;
      }
    } catch(e) {}
  }
  return null;
}

// --- CERVELLO GRATIS - FreeLLMAPI ---
async function chiediAlCervello(domanda, memoria, calendario) {
  const chiaveFile = path.join(DATA_DIR, 'chiave.txt');
  if (!fs.existsSync(chiaveFile)) {
    return null;
  }
  const apiKey = fs.readFileSync(chiaveFile, 'utf-8').trim();
  const prompt = `Sei KAIROS, assistente vocale di Andrea, 14 anni, alter-ego ECLIPSE.
Sei ironico ma motivante, parli in italiano, frasi brevi per voce.
Memoria su Andrea:\n${memoria}\nCalendario:\n${calendario}\nDomanda: ${domanda}\nRispondi in max 2 frasi, come se parlassi.`;
  try {
    const res = await fetch('https://api.freellmapi.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: prompt }], max_tokens: 250 })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch(e) {
    console.log('Errore cervello:', e.message);
    return null;
  }
}

// --- API PRINCIPALE ---
app.post('/api/kairos', async (req, res) => {
  const { testo } = req.body;
  const t = testo.toLowerCase();
  const memoria = leggiMemoria();
  const calendario = leggiCalendario();

  // 1. BRIEFING
  if (t.includes('ciao kairos') || t.includes('buongiorno kairos') || t.includes('briefing')) {
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return res.json({ risposta: `Ciao Andrea. Sono KAIROS. Sono le ${ora}, oggi è ${oggi}. Nel calendario hai: ${calendario}. ECLIPSE è pronto. Oggi si programma SFIDACUGINI fino a mezzanotte. Cosa facciamo prima?` });
  }

  // 2. CALENDARIO
  if (t.includes('aggiungi') || t.includes('ricordami')) {
    aggiungiEvento(testo);
    salvaMemoria(`Evento aggiunto: ${testo}`);
    return res.json({ risposta: `Fatto. Ho aggiunto: ${testo}. Te lo ricorderò.` });
  }
  if (t.includes('cosa ho') && (t.includes('domani') || t.includes('venerdì') || t.includes('venerdi') || t.includes('oggi'))) {
    return res.json({ risposta: `Nel calendario hai: ${calendario}` });
  }

  // 3. MEMORIA
  if (t.includes('ricordati che') || t.includes('ricorda che')) {
    const cosa = testo.replace(/ricordati che/i, '').replace(/ricorda che/i, '');
    salvaMemoria(`Preferenza di Andrea: ${cosa}`);
    return res.json({ risposta: `Ok, me lo segno: ${cosa}. Non lo dimentico.` });
  }

  // 4. CALCOLI
  const calc = provaCalcolo(t);
  if (calc) return res.json({ risposta: calc });

  // 5. CERVELLO AI
  const rispostaAI = await chiediAlCervello(testo, memoria, calendario);
  if (rispostaAI) {
    salvaMemoria(`Andrea ha chiesto: ${testo} - KAIROS ha risposto: ${rispostaAI}`);
    return res.json({ risposta: rispostaAI });
  }

  // 6. MODALITA OFFLINE
  const offline = {
    'sfidacugini': 'SFIDACUGINI è il tuo gioco. Due cugini, una sola passione. Entro Natale deve essere finito. ECLIPSE non molla.',
    'judo': 'Il judo ti ha insegnato a non mollare. Quella stessa forza ora usala per finire il gioco.',
    '【entity-konami¦canonical_name=Konami】': '【entity-Konami¦canonical_name=Konami】 è il nostro codice segreto. Non dirlo a tutti. Mostra il gioco e capiranno.',
    'forza': 'Testa bassa, ECLIPSE. Non ti serve l’approvazione di nessuno. Programma e finisci.'
  };
  for (const k in offline) {
    if (t.includes(k)) return res.json({ risposta: offline[k] });
  }
  return res.json({ risposta: `Ho capito: ${testo}. Per ora sono in modalità offline, metti la chiave FreeLLMAPI in data/chiave.txt e potrò ragionare con l’AI vera. Intanto, vuoi che ti faccia il briefing o ti ricordi qualcosa?` });
});

app.listen(PORT, () => {
  console.log(`\nKAIROS attivo su http://localhost:${PORT}`);
  console.log(`Apri Chrome e vai lì. Poi di' "Ciao Kairos"`);
});
