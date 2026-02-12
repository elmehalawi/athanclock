let activeTimeouts = [];

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function scheduleNotifications(prayerTimes) {
  cancelAllNotifications();

  const now = Date.now();
  const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const labels = {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  };

  for (const prayer of prayers) {
    const time = prayerTimes[prayer];
    if (!time) continue;
    const delay = time.getTime() - now;
    if (delay <= 0) continue;

    const id = setTimeout(() => {
      new Notification(`${labels[prayer]} Prayer Time`, {
        body: `It's time for ${labels[prayer]} prayer.`,
        icon: '/favicon.ico',
        tag: prayer,
      });
    }, delay);
    activeTimeouts.push(id);
  }
}

export function cancelAllNotifications() {
  for (const id of activeTimeouts) {
    clearTimeout(id);
  }
  activeTimeouts = [];
}
