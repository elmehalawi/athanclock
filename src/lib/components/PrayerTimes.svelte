<script>
  import { onMount, onDestroy } from 'svelte';
  import { prayers } from '../stores/prayers.js';
  import { location } from '../stores/location.js';

  const PRAYER_LABELS = {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  };

  const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  let countdown = $state('');
  let hijriDate = $state('');
  let countdownInterval;
  let midnightTimeout;

  function updateHijriDate() {
    hijriDate = new Intl.DateTimeFormat('en-US', {
      calendar: 'islamic-umalqura',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  function formatTime(date, tz) {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(date);
  }

  function updateCountdown(nextPrayer) {
    if (!nextPrayer) {
      countdown = '';
      return;
    }
    const diff = nextPrayer.time.getTime() - Date.now();
    if (diff <= 0) {
      countdown = 'Now';
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    countdown = `${h}h ${m}m ${s}s`;
  }

  function scheduleMidnightRefresh() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 5, 0);
    const delay = tomorrow.getTime() - now.getTime();
    midnightTimeout = setTimeout(() => {
      updateHijriDate();
      scheduleMidnightRefresh();
    }, delay);
  }

  onMount(() => {
    updateHijriDate();
    scheduleMidnightRefresh();
  });

  onDestroy(() => {
    clearInterval(countdownInterval);
    clearTimeout(midnightTimeout);
  });

  $effect(() => {
    const p = $prayers;
    if (p?.nextPrayer) {
      clearInterval(countdownInterval);
      updateCountdown(p.nextPrayer);
      countdownInterval = setInterval(() => updateCountdown(p.nextPrayer), 1000);
    }
  });
</script>

{#if $prayers}
  <div class="prayer-times">
    <div class="header">
      <h2>{$location?.name} <span class="cc">{$location?.cc}</span></h2>
      {#if hijriDate}
        <p class="hijri-date">{hijriDate}</p>
      {/if}
      {#if $prayers.nextPrayer}
        <p class="countdown">
          Next: <strong>{PRAYER_LABELS[$prayers.nextPrayer.name]}</strong> in {countdown}
        </p>
      {/if}
    </div>

    <ul class="times-list">
      {#each PRAYER_ORDER as key}
        <li class:active={$prayers.nextPrayer?.name === key}>
          <span class="label">{PRAYER_LABELS[key]}</span>
          <span class="time">{formatTime($prayers[key], $location?.tz)}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .prayer-times {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .cc {
    opacity: 0.5;
    font-size: 0.85rem;
    margin-left: 0.5rem;
  }

  .hijri-date {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.6;
  }

  .countdown {
    margin: 0.5rem 0 0;
    font-size: 1.1rem;
    color: var(--accent);
  }

  .times-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .times-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    transition: background 0.15s;
  }

  .times-list li + li {
    border-top: 1px solid var(--border);
  }

  .times-list li.active {
    background: var(--accent-bg);
  }

  .times-list li.active .label {
    font-weight: 700;
    color: var(--accent);
  }

  .label {
    font-size: 1.05rem;
  }

  .time {
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
    opacity: 0.9;
  }
</style>
