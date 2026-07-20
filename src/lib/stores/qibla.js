import { derived } from 'svelte/store';
import { Coordinates, Qibla } from 'adhan';
import geomagnetism from 'geomagnetism';
import { location } from './location.js';

// Derives the Qibla direction for the current location.
//   bearing     — degrees clockwise from TRUE north (from adhan's Qibla helper)
//   declination — local magnetic declination in degrees, east positive (WMM)
//
// The declination lets us convert a magnetic-north heading (Android sensors)
// into a true-north heading so it lines up with `bearing`. iOS already reports
// true north, so callers apply declination only when the reading is magnetic.
export const qibla = derived(location, ($location) => {
  if (!$location) return null;

  const coords = new Coordinates($location.lat, $location.lng);
  const bearing = Qibla(coords);

  let declination = 0;
  try {
    // allowOutOfBoundsModel keeps this from throwing once the bundled WMM epoch
    // lapses — it extrapolates instead of crashing. The build check
    // (scripts/check-wmm.js) warns us to upgrade before that happens.
    const model = geomagnetism.model(new Date(), { allowOutOfBoundsModel: true });
    declination = model.point([$location.lat, $location.lng]).decl;
  } catch {
    declination = 0;
  }

  return { bearing, declination };
});
