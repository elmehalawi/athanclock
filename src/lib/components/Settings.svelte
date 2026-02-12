<script>
  import { settings } from '../stores/settings.js';
  import { requestNotificationPermission } from '../utils/notifications.js';

  const METHODS = [
    ['MuslimWorldLeague', 'Muslim World League'],
    ['Egyptian', 'Egyptian General Authority'],
    ['Karachi', 'University of Islamic Sciences, Karachi'],
    ['UmmAlQura', 'Umm al-Qura University, Makkah'],
    ['Dubai', 'Dubai'],
    ['MoonsightingCommittee', 'Moonsighting Committee'],
    ['NorthAmerica', 'ISNA (North America)'],
    ['Kuwait', 'Kuwait'],
    ['Qatar', 'Qatar'],
    ['Singapore', 'Singapore'],
    ['Tehran', 'Institute of Geophysics, Tehran'],
    ['Turkey', 'Diyanet, Turkey'],
  ];

  async function handleNotificationToggle(e) {
    if (e.target.checked) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        e.target.checked = false;
        return;
      }
    }
    settings.update((s) => ({ ...s, notifications: e.target.checked }));
  }
</script>

<div class="settings">
  <h3>Settings</h3>

  <label class="field">
    <span>Calculation Method</span>
    <select
      value={$settings.method}
      onchange={(e) => settings.update((s) => ({ ...s, method: e.target.value }))}
    >
      {#each METHODS as [key, label]}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </label>

  <label class="field">
    <span>Madhab (Asr calculation)</span>
    <select
      value={$settings.madhab}
      onchange={(e) => settings.update((s) => ({ ...s, madhab: e.target.value }))}
    >
      <option value="Shafi">Shafi / Maliki / Hanbali</option>
      <option value="Hanafi">Hanafi</option>
    </select>
  </label>

  <label class="field toggle">
    <span>Prayer notifications</span>
    <input
      type="checkbox"
      checked={$settings.notifications}
      onchange={handleNotificationToggle}
    />
  </label>
</div>

<style>
  .settings {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1.2rem;
  }

  .field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    gap: 1rem;
  }

  .field + .field {
    border-top: 1px solid var(--border);
  }

  .field span {
    font-size: 0.95rem;
  }

  select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.9rem;
    max-width: 220px;
  }

  .toggle input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: var(--accent);
  }
</style>
