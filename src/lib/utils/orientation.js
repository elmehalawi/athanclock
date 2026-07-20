// Cross-platform device-orientation compass helper.
//
// There is no dedicated compass Web API — heading is derived from
// DeviceOrientationEvent, and the two platforms differ:
//
//   iOS Safari      event.webkitCompassHeading — a clean 0-360 heading the OS
//                   has already fused and corrected to TRUE north.
//   Android/Chrome  the `deviceorientationabsolute` event — event.alpha is
//                   measured counterclockwise from MAGNETIC north.
//
// So each reading is tagged with `isTrueNorth`; the caller applies magnetic
// declination only when it's false. Everything here is device-local: motion
// sensors + math, nothing touches the network.

export function orientationSupported() {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

// Returns 'granted' | 'denied' | 'unsupported'.
// On iOS 13+ this MUST be called from a user gesture (a click/tap handler).
export async function requestOrientationPermission() {
  if (!orientationSupported()) return 'unsupported';
  const DOE = window.DeviceOrientationEvent;
  if (typeof DOE.requestPermission === 'function') {
    try {
      return await DOE.requestPermission();
    } catch {
      return 'denied';
    }
  }
  // Android / desktop: no explicit permission prompt exists.
  return 'granted';
}

// True when the platform requires an explicit permission prompt (iOS 13+).
export function needsOrientationPermission() {
  return (
    orientationSupported() &&
    typeof window.DeviceOrientationEvent.requestPermission === 'function'
  );
}

// Starts listening for headings. `onHeading` receives
// { heading, isTrueNorth, accuracy }. Returns a cleanup function.
export function startCompass(onHeading) {
  const handler = (event) => {
    let heading = null;
    let isTrueNorth = false;
    let accuracy = null;

    if (
      typeof event.webkitCompassHeading === 'number' &&
      !Number.isNaN(event.webkitCompassHeading)
    ) {
      // iOS: already true north, clockwise.
      heading = event.webkitCompassHeading;
      isTrueNorth = true;
      accuracy =
        typeof event.webkitCompassAccuracy === 'number'
          ? event.webkitCompassAccuracy
          : null;
    } else if (event.absolute === true && typeof event.alpha === 'number') {
      // Android absolute: alpha is CCW from magnetic north. Convert to a
      // clockwise compass heading and compensate for screen rotation.
      heading = (360 - event.alpha + screenAngle()) % 360;
      if (heading < 0) heading += 360;
      isTrueNorth = false;
    } else {
      // Relative-only orientation (no compass reference) — unusable.
      return;
    }

    onHeading({ heading, isTrueNorth, accuracy });
  };

  // iOS fires plain 'deviceorientation' (carrying webkitCompassHeading);
  // Android fires 'deviceorientationabsolute'. Registering both is safe: the
  // handler ignores any event without a usable compass reference, so Android's
  // relative 'deviceorientation' is skipped and only the absolute one is used.
  window.addEventListener('deviceorientationabsolute', handler, true);
  window.addEventListener('deviceorientation', handler, true);

  return () => {
    window.removeEventListener('deviceorientationabsolute', handler, true);
    window.removeEventListener('deviceorientation', handler, true);
  };
}

function screenAngle() {
  if (
    typeof screen !== 'undefined' &&
    screen.orientation &&
    typeof screen.orientation.angle === 'number'
  ) {
    return screen.orientation.angle;
  }
  if (typeof window !== 'undefined' && typeof window.orientation === 'number') {
    return window.orientation;
  }
  return 0;
}
