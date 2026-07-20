<script>
  import { onDestroy } from 'svelte';
  import { qibla } from '../stores/qibla.js';
  import {
    startCompass,
    requestOrientationPermission,
    needsOrientationPermission,
    orientationSupported,
  } from '../utils/orientation.js';

  const ALIGN_THRESHOLD = 4; // degrees within which we consider you "facing" Qibla

  let open = $state(false);
  let permission = $state('idle'); // idle | granted | denied | unsupported
  let heading = $state(null); // raw device heading (as reported)
  let isTrueNorth = $state(false);
  let accuracy = $state(null); // iOS webkitCompassAccuracy, if available
  let wasAligned = false;

  let stop = null;

  // Qibla bearing from TRUE north, plus local magnetic declination.
  const bearing = $derived($qibla?.bearing ?? null);
  const declination = $derived($qibla?.declination ?? 0);

  const live = $derived(heading !== null);

  // Convert the raw reading to a true-north heading. iOS is already true north;
  // Android reports magnetic north, so we add declination (east positive).
  const trueHeading = $derived(
    heading === null ? null : isTrueNorth ? heading : heading + declination
  );

  // When live, rotate the rose so N tracks real north; when static, N stays up.
  const effectiveHeading = $derived(live ? trueHeading : 0);
  const roseRotation = $derived(-(effectiveHeading ?? 0));
  const needleRotation = $derived(
    bearing === null ? 0 : bearing - (effectiveHeading ?? 0)
  );

  // Signed difference between where you're facing and the Qibla, in [-180, 180].
  const offBy = $derived(
    live && bearing !== null ? norm180(bearing - trueHeading) : null
  );
  const aligned = $derived(offBy !== null && Math.abs(offBy) <= ALIGN_THRESHOLD);

  // iOS reports accuracy in degrees; negative means uncalibrated.
  const needsCalibration = $derived(
    live && isTrueNorth && accuracy !== null && (accuracy < 0 || accuracy > 15)
  );

  $effect(() => {
    if (aligned && !wasAligned) {
      navigator.vibrate?.(60);
    }
    wasAligned = aligned;
  });

  function norm180(deg) {
    let d = ((deg % 360) + 360) % 360;
    if (d > 180) d -= 360;
    return d;
  }

  function compassLabel(deg) {
    const dirs = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
    ];
    return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
  }

  async function enable() {
    const result = await requestOrientationPermission();
    permission = result;
    if (result === 'granted') startLive();
  }

  function startLive() {
    stopLive();
    stop = startCompass((r) => {
      heading = r.heading;
      isTrueNorth = r.isTrueNorth;
      accuracy = r.accuracy;
    });
  }

  function stopLive() {
    stop?.();
    stop = null;
    heading = null;
  }

  async function openCompass() {
    open = true;
    if (!orientationSupported()) {
      permission = 'unsupported';
      return;
    }
    // Android/desktop need no prompt — start immediately. iOS waits for the
    // explicit "Enable compass" tap so requestPermission() has a user gesture.
    if (!needsOrientationPermission()) {
      await enable();
    }
  }

  function closeCompass() {
    stopLive();
    open = false;
    permission = 'idle';
    wasAligned = false;
  }

  function onKey(e) {
    if (e.key === 'Escape') closeCompass();
  }

  onDestroy(stopLive);
</script>

<svelte:window on:keydown={open ? onKey : undefined} />

<button class="qibla-fab" onclick={openCompass} aria-label="Open Qibla compass" title="Qibla compass">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,7 14.5,14.5 12,12.8 9.5,14.5" fill="currentColor" stroke="none" />
  </svg>
</button>

{#if open}
  <div class="overlay">
    <button class="backdrop" aria-label="Close Qibla compass" tabindex="-1" onclick={closeCompass}></button>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Qibla compass">
      <div class="sheet-head">
        <h2>Qibla</h2>
        <button class="close" onclick={closeCompass} aria-label="Close">✕</button>
      </div>

      {#if bearing === null}
        <p class="muted">Set your location first to find the Qibla direction.</p>
      {:else}
        <div class="dial" class:aligned>
          <!-- Fixed pointer marking the direction the device faces -->
          <div class="device-pointer" aria-hidden="true"></div>

          <div class="rose" style="transform: rotate({roseRotation}deg)">
            <span class="card n">N</span>
            <span class="card e">E</span>
            <span class="card s">S</span>
            <span class="card w">W</span>
          </div>

          <!-- Qibla marker: points toward the Kaaba relative to device forward -->
          <div class="qibla-arm" style="transform: rotate({needleRotation}deg)" aria-hidden="true">
            <div class="qibla-marker">🕋</div>
          </div>
        </div>

        <div class="readout">
          <div class="bearing">
            {Math.round(bearing)}° <span class="muted">from North ({compassLabel(bearing)})</span>
          </div>

          {#if live}
            {#if aligned}
              <div class="status ok">Facing the Qibla 🕋</div>
            {:else}
              <div class="status">
                Turn {offBy > 0 ? 'right' : 'left'} {Math.round(Math.abs(offBy))}°
              </div>
            {/if}
            {#if needsCalibration}
              <div class="hint">Compass needs calibration — move your phone in a figure-8.</div>
            {/if}
          {:else if permission === 'idle'}
            <button class="enable" onclick={enable}>Enable compass</button>
            <div class="hint">Uses your device's motion sensors. Nothing leaves your device.</div>
          {:else if permission === 'denied'}
            <div class="hint">
              Compass permission was denied. Face {Math.round(bearing)}° ({compassLabel(bearing)})
              from North — you can align it using a separate compass.
            </div>
          {:else}
            <!-- granted but no live sensor (e.g. desktop), or unsupported -->
            <div class="hint">
              No live compass on this device. Face {Math.round(bearing)}° ({compassLabel(bearing)})
              from North, e.g. with a separate compass.
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .qibla-fab {
    position: fixed;
    top: max(1rem, env(safe-area-inset-top));
    right: max(1rem, env(safe-area-inset-right));
    z-index: 40;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--surface);
    color: var(--accent);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .qibla-fab:hover {
    background: var(--hover);
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    border: none;
    padding: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .sheet {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 360px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem;
  }

  .sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .sheet-head h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--accent);
  }

  .close {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
  }

  .dial {
    position: relative;
    width: 240px;
    height: 240px;
    margin: 0.5rem auto 1.25rem;
    border-radius: 50%;
    border: 2px solid var(--border);
    background:
      radial-gradient(circle at center, var(--accent-bg) 0%, transparent 62%);
    transition: box-shadow 0.2s ease;
  }

  .dial.aligned {
    box-shadow: 0 0 0 3px var(--accent), 0 0 22px var(--accent-bg);
  }

  .device-pointer {
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 14px solid var(--text-muted);
    z-index: 3;
  }

  .rose {
    position: absolute;
    inset: 0;
    transition: transform 0.12s linear;
  }

  .card {
    position: absolute;
    left: 50%;
    top: 50%;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
    transform-origin: center;
  }

  .card.n { transform: translate(-50%, calc(-50% - 100px)); color: var(--accent); }
  .card.s { transform: translate(-50%, calc(-50% + 100px)); }
  .card.e { transform: translate(calc(-50% + 100px), -50%); }
  .card.w { transform: translate(calc(-50% - 100px), -50%); }

  .qibla-arm {
    position: absolute;
    inset: 0;
    transition: transform 0.12s linear;
    z-index: 2;
  }

  .qibla-marker {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, calc(-50% - 88px));
    font-size: 1.6rem;
    filter: drop-shadow(0 0 6px var(--accent));
  }

  .readout {
    text-align: center;
  }

  .bearing {
    font-size: 1.4rem;
    font-weight: 700;
  }

  .status {
    margin-top: 0.5rem;
    font-size: 1rem;
    color: var(--text);
  }

  .status.ok {
    color: var(--accent);
    font-weight: 700;
  }

  .muted {
    color: var(--text-muted);
    font-weight: 400;
    font-size: 0.9rem;
  }

  .hint {
    margin-top: 0.6rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .enable {
    margin-top: 0.75rem;
    padding: 0.55rem 1.25rem;
    border: 1px solid var(--accent);
    border-radius: 8px;
    background: var(--accent-bg);
    color: var(--accent);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
  }
</style>
