import Fuse from 'fuse.js';
import { haversine } from './haversine.js';
import citiesData from '../../data/cities.json';

let cities = null;
let fuse = null;

export async function loadCities() {
  if (cities) return;
  cities = citiesData;
  fuse = new Fuse(cities, {
    keys: ['n', 'a'],
    threshold: 0.3,
    limit: 8,
  });
}

export function searchCities(query) {
  if (!fuse || !query.trim()) return [];
  return fuse.search(query, { limit: 8 }).map((r) => r.item);
}

export function reverseGeocode(lat, lng) {
  if (!cities) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const city of cities) {
    const d = haversine(lat, lng, city.lat, city.lng);
    if (d < minDist) {
      minDist = d;
      nearest = city;
    }
  }
  return nearest;
}
