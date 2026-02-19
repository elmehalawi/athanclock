import { writable } from 'svelte/store';

const STORAGE_KEY = 'athan-settings';

const DEFAULTS = {
  method: 'NorthAmerica',
  madhab: 'Shafi',
  notifications: false,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  subscribe((value) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return { subscribe, set, update };
}

export const settings = createSettingsStore();
