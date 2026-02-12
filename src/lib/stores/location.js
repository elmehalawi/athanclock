import { writable } from 'svelte/store';

const STORAGE_KEY = 'athan-location';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function createLocationStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  subscribe((value) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    set,
    update,
    clear() {
      localStorage.removeItem(STORAGE_KEY);
      set(null);
    },
  };
}

export const location = createLocationStore();
