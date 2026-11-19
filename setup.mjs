// KAIROS - Setup
// Crea cartelle e file base per KAIROS
import fs from 'fs';

if (!fs.existsSync('data')) fs.mkdirSync('data');

if (!fs.existsSync('data/calendario.txt')) {
  fs.writeFileSync('data/calendario.txt', '2026-11-20 18:00 Palestra\n2026-11-21 09:00 Verifica italiano - ECLIPSE mode\n2026-12-25 00:00 Natale - Mostra SFIDACUGINI a papa\n');
}

if (!fs.existsSync('data/chiave.txt')) {
  fs.writeFileSync('data/chiave.txt', '');
}

console.log('KAIROS setup fatto. Metti la chiave FreeLLMAPI in data/chiave.txt (opzionale). Poi: npm start');
