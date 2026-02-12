<script>
  import { onMount } from 'svelte';
  import { loadCities, searchCities, reverseGeocode } from '../utils/cities.js';
  import { location } from '../stores/location.js';

  let query = $state('');
  let results = $state([]);
  let loading = $state(true);
  let locating = $state(false);
  let debounceTimer;

  onMount(async () => {
    await loadCities();
    loading = false;
  });

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      results = searchCities(query);
    }, 300);
  }

  function selectCity(city) {
    location.set({
      name: city.n,
      lat: city.lat,
      lng: city.lng,
      tz: city.tz,
      cc: city.cc,
    });
    query = '';
    results = [];
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    locating = true;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
        })
      );
      const city = reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (city) selectCity(city);
    } catch (err) {
      console.warn('Geolocation error:', err.message);
    } finally {
      locating = false;
    }
  }
</script>

<div class="city-search">
  {#if loading}
    <p class="loading">Loading city database...</p>
  {:else}
    <div class="search-row">
      <input
        type="text"
        placeholder="Search for a city..."
        bind:value={query}
        oninput={handleInput}
        autocomplete="off"
      />
      <button class="locate-btn" onclick={useMyLocation} disabled={locating}>
        {locating ? 'Locating...' : 'Use My Location'}
      </button>
    </div>

    {#if results.length > 0}
      <ul class="results">
        {#each results as city}
          <li>
            <button onclick={() => selectCity(city)}>
              {city.n} <span class="cc">{city.cc}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .city-search {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .loading {
    text-align: center;
    opacity: 0.6;
  }

  .search-row {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-size: 1rem;
  }

  input::placeholder {
    color: var(--text-muted);
  }

  .locate-btn {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .locate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .results {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .results li button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: var(--surface);
    color: var(--text);
    text-align: left;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .results li button:hover {
    background: var(--hover);
  }

  .results li + li button {
    border-top: 1px solid var(--border);
  }

  .cc {
    opacity: 0.5;
    font-size: 0.8rem;
    margin-left: 0.25rem;
  }
</style>
