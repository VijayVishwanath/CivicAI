import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(line) {
  const res = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      res.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  res.push(cur);
  return res;
}

function deterministicScore(id) {
  // Simple deterministic pseudo-random based on id string
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r = (h % 1000) / 1000; // 0..0.999
  return 0.4 + r * 0.58; // scale to ~0.4..0.98
}

function derivePriority(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

function extractFeatures(text) {
  if (!text) return [];
  const words = text
    .replace(/[\.\,\-\(\)\:\;"'\/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 5);
  const uniq = [...new Set(words)];
  return uniq.slice(0, 5);
}

function main() {
  const csvPath = path.resolve(__dirname, '..', 'data', 'municipal_cases_10000.csv');
  const outPath = path.resolve(__dirname, '..', 'src', 'mocks', 'cases.json');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    process.exit(1);
  }
  const txt = fs.readFileSync(csvPath, 'utf8');
  const lines = txt.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((ln) => parseCSVLine(ln));

  const out = rows.map((cols) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = cols[i] ?? '';
    const id = obj.case_id;
    const score = Number(obj.score) || deterministicScore(id);
    const priority = obj.priority || derivePriority(score);
    const features = extractFeatures(obj.description || obj.sub_category || obj.category);
    const location = `${obj.city || ''}${obj.city && obj.district ? ', ' : ''}${obj.district || ''}`;
    return {
      id,
      location,
      category: obj.category || obj.sub_category || 'general',
      score: Math.round(score * 100) / 100,
      priority,
      features,
      recommendedAction: 'Investigate and assign to field team',
      description: obj.description || '',
      submittedAt: obj.created_at || new Date().toISOString(),
      status: 'pending',
      affectedCitizens: Math.floor(1 + (id.length % 50)),
      duplicateReports: Math.floor(1 + (id.length % 3)),
    };
  });
  // ensure minimum counts per priority (high, medium, low)
  const byPriority = { high: [], medium: [], low: [] };
  out.forEach((c) => {
    const p = c.priority || derivePriority(c.score || 0.5);
    if (!byPriority[p]) byPriority[p] = [];
    byPriority[p].push(c);
  });

  // Helper to promote/demote existing cases to reach at least minCount
  const minCount = 10;
  function ensureCount(target) {
    const keys = Object.keys(byPriority);
    const current = byPriority[target].length;
    if (current >= minCount) return;
    // find candidates from other buckets sorted by closeness to target score
    const candidates = [];
    keys.forEach((k) => {
      if (k === target) return;
      byPriority[k].forEach((c) => candidates.push(c));
    });
    // sort candidates by score distance to the threshold for target
    const targetScore = target === 'high' ? 0.8 : target === 'medium' ? 0.6 : 0.4;
    candidates.sort((a, b) => Math.abs((a.score || 0.5) - targetScore) - Math.abs((b.score || 0.5) - targetScore));
    let i = 0;
    while (byPriority[target].length < minCount && i < candidates.length) {
      const c = candidates[i++];
      // update score and priority
      if (target === 'high') c.score = Math.max(0.8, c.score || 0.8);
      if (target === 'medium') c.score = Math.max(0.55, Math.min(0.74, c.score || 0.6));
      if (target === 'low') c.score = Math.min(0.49, c.score || 0.3);
      c.priority = target;
      // move between buckets
      // remove from other buckets if present
      Object.keys(byPriority).forEach((k) => {
        byPriority[k] = byPriority[k].filter((x) => x.id !== c.id);
      });
      byPriority[target].push(c);
    }
    // if still short, synthesize new records
    let synthIndex = 1;
    while (byPriority[target].length < minCount) {
      const synth = {
        id: `SYNTH-${target.toUpperCase()}-${String(synthIndex).padStart(2, '0')}`,
        location: 'Synthetic City',
        category: 'general',
        score: target === 'high' ? 0.85 : target === 'medium' ? 0.6 : 0.3,
        priority: target,
        features: ['synthetic'],
        recommendedAction: 'Investigate',
        description: 'Synthetic case to ensure minimum category coverage',
        submittedAt: new Date().toISOString(),
        status: 'pending',
        affectedCitizens: 5,
        duplicateReports: 1,
      };
      byPriority[target].push(synth);
      synthIndex++;
    }
  }

  ensureCount('high');
  ensureCount('medium');
  ensureCount('low');

  // reconstruct out from buckets (preserve original ordering roughly by submittedAt desc)
  const merged = [...byPriority.high, ...byPriority.medium, ...byPriority.low];

  // ensure output directory exists
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log('Wrote', merged.length, 'cases to', outPath);
}

main();
