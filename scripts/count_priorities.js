import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.resolve(__dirname, '..', 'src', 'mocks', 'cases.json');
const txt = fs.readFileSync(file, 'utf8');
const arr = JSON.parse(txt);
const counts = arr.reduce((acc, c) => {
  const p = c.priority || 'unknown';
  acc[p] = (acc[p] || 0) + 1;
  return acc;
}, {});
console.log('Total cases:', arr.length);
console.log('Counts by priority:', counts);
