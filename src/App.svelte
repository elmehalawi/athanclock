<script>
  import { location } from './lib/stores/location.js';
  import { settings } from './lib/stores/settings.js';
  import { prayers } from './lib/stores/prayers.js';
  import { scheduleNotifications, cancelAllNotifications } from './lib/utils/notifications.js';
  import CitySearch from './lib/components/CitySearch.svelte';
  import PrayerTimes from './lib/components/PrayerTimes.svelte';
  import Settings from './lib/components/Settings.svelte';

  let showSettings = $state(false);

  $effect(() => {
    if ($prayers && $settings.notifications) {
      scheduleNotifications($prayers);
    } else {
      cancelAllNotifications();
    }
  });
</script>

<main>
  <header>
    <h1>Athan Clock</h1>
  </header>

  {#if !$location}
    <section class="welcome">
      <p>Find your city to see prayer times.</p>
      <CitySearch />
    </section>
  {:else}
    <section class="compact-search">
      <CitySearch />
    </section>

    <PrayerTimes />

    <div class="settings-toggle">
      <button onclick={() => (showSettings = !showSettings)}>
        {showSettings ? 'Hide Settings' : 'Settings'}
      </button>
    </div>

    {#if showSettings}
      <section class="settings-panel">
        <Settings />
      </section>
    {/if}
  {/if}

  <footer>
    <p>Privacy-first. Nothing ever leaves your device.</p>
  </footer>
</main>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--accent);
  }

  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .welcome p {
    font-size: 1.1rem;
    opacity: 0.7;
    margin: 0;
  }

  .compact-search {
    margin-bottom: 1.5rem;
  }

  .settings-toggle {
    text-align: center;
    margin: 1.5rem 0 0.5rem;
  }

  .settings-toggle button {
    padding: 0.5rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .settings-panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
  }

  footer {
    margin-top: auto;
    padding-top: 2rem;
    text-align: center;
    font-size: 0.8rem;
    opacity: 0.5;
  }

  footer p {
    margin: 0;
  }
</style>
