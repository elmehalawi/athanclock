import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { writeFile, readFile, unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { Writable } from 'stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DATA = join(ROOT, 'src', 'data');
const ZIP_URL = 'https://download.geonames.org/export/dump/cities15000.zip';
const ZIP_PATH = join(ROOT, 'cities15000.zip');
const TSV_PATH = join(ROOT, 'cities15000.txt');

async function download(url, dest) {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const fileStream = createWriteStream(dest);
  await pipeline(res.body, fileStream);
  console.log('Download complete.');
}

async function unzip(zipPath, outDir) {
  console.log('Unzipping...');
  // Use the unzip command since Node doesn't have built-in zip support
  const { execSync } = await import('child_process');
  execSync(`unzip -o "${zipPath}" -d "${outDir}"`, { stdio: 'pipe' });
  console.log('Unzip complete.');
}

async function parseTSV(tsvPath) {
  console.log('Parsing TSV...');
  const cities = [];

  const rl = createInterface({
    input: createReadStream(tsvPath, 'utf8'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    // GeoNames cities15000.txt columns:
    // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames,
    // 4: latitude, 5: longitude, 6: feature class, 7: feature code,
    // 8: country code, 9: cc2, 10: admin1 code, 11: admin2 code,
    // 12: admin3 code, 13: admin4 code, 14: population,
    // 15: elevation, 16: dem, 17: timezone, 18: modification date
    const name = cols[1];
    const asciiname = cols[2];
    const lat = parseFloat(cols[4]);
    const lng = parseFloat(cols[5]);
    const cc = cols[8];
    const population = parseInt(cols[14], 10) || 0;
    const tz = cols[17];

    if (!name || isNaN(lat) || isNaN(lng) || !tz) continue;

    cities.push({
      n: name,
      a: asciiname !== name ? asciiname : undefined,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      cc,
      tz,
      p: population,
    });
  }

  // Sort by population descending for better search relevance
  cities.sort((a, b) => b.p - a.p);

  console.log(`Parsed ${cities.length} cities.`);
  return cities;
}

async function main() {
  if (!existsSync(SRC_DATA)) mkdirSync(SRC_DATA, { recursive: true });

  await download(ZIP_URL, ZIP_PATH);
  await unzip(ZIP_PATH, ROOT);

  const cities = await parseTSV(TSV_PATH);

  const outPath = join(SRC_DATA, 'cities.json');
  await writeFile(outPath, JSON.stringify(cities));

  const stats = await readFile(outPath);
  console.log(`Written ${outPath} (${(stats.length / 1024 / 1024).toFixed(2)} MB)`);

  // Cleanup
  await unlink(ZIP_PATH).catch(() => {});
  await unlink(TSV_PATH).catch(() => {});
  // Also remove readme if extracted
  await unlink(join(ROOT, 'readme.txt')).catch(() => {});

  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
