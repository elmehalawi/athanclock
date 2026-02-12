import { derived } from 'svelte/store';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { location } from './location.js';
import { settings } from './settings.js';

export const prayers = derived([location, settings], ([$location, $settings]) => {
  if (!$location) return null;

  const coords = new Coordinates($location.lat, $location.lng);
  const methodFn = CalculationMethod[$settings.method];
  if (!methodFn) return null;

  const params = methodFn();
  params.madhab = Madhab[$settings.madhab];

  const now = new Date();
  const times = new PrayerTimes(coords, now, params);

  const prayerList = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const result = {};
  for (const p of prayerList) {
    result[p] = times[p];
  }

  // Determine next prayer
  const nextPrayerName = times.nextPrayer(now);
  result.nextPrayer =
    nextPrayerName !== 'none'
      ? { name: nextPrayerName, time: times.timeForPrayer(nextPrayerName) }
      : null;

  return result;
});
