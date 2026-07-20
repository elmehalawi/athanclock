// Build-time guard: warns when the bundled World Magnetic Model is close to,
// or past, its validity window. The `geomagnetism` package bundles WMM
// coefficients for a fixed epoch (currently WMM 2025, valid until ~2029-11-13).
// When it lapses, run `npm update geomagnetism` (or bump the version) to pick up
// the next epoch's coefficients, then rebuild. This never fails the build — it
// only prints a warning so an outdated model can't silently ship.
import geomagnetism from 'geomagnetism';

const WARN_WINDOW_DAYS = 180;
const MS_PER_DAY = 86400000;

const now = new Date();
const model = geomagnetism.model(now, { allowOutOfBoundsModel: true });
const end = model.end_date;
const daysLeft = Math.floor((end.getTime() - now.getTime()) / MS_PER_DAY);
const until = end.toISOString().slice(0, 10);

const RED = '\x1b[41m\x1b[97m';
const YELLOW = '\x1b[43m\x1b[30m';
const RESET = '\x1b[0m';

if (daysLeft < 0) {
  console.warn(
    `\n${RED} WMM EXPIRED ${RESET} The bundled magnetic model (WMM ${model.epoch}) ` +
      `expired on ${until} (${-daysLeft} days ago).\n` +
      `  Qibla declination is now extrapolated and drifting. ` +
      `Run \`npm update geomagnetism\` and rebuild.\n`
  );
} else if (daysLeft <= WARN_WINDOW_DAYS) {
  console.warn(
    `\n${YELLOW} WMM EXPIRING ${RESET} The bundled magnetic model (WMM ${model.epoch}) ` +
      `expires on ${until} (in ${daysLeft} days).\n` +
      `  Plan to run \`npm update geomagnetism\` before then.\n`
  );
} else {
  console.log(
    `WMM ${model.epoch} magnetic model OK — valid until ${until} (${daysLeft} days left).`
  );
}
