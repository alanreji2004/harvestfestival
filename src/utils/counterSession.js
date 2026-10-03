const COUNTER_SESSION_KEY = 'harvest_festival_active_counter';

export const VALID_COUNTERS = [
  'Counter 1',
  'Counter 2',
  'Counter 3',
  'Counter 4'
];

/**
 * Gets currently active counter from session storage
 */
export const getActiveCounter = () => {
  try {
    const saved = sessionStorage.getItem(COUNTER_SESSION_KEY);
    if (saved && VALID_COUNTERS.includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Session storage read error:', e);
  }
  return null;
};

/**
 * Sets active counter in session storage
 */
export const setActiveCounter = (counterName) => {
  if (!VALID_COUNTERS.includes(counterName)) {
    throw new Error('Invalid counter selection.');
  }
  try {
    sessionStorage.setItem(COUNTER_SESSION_KEY, counterName);
  } catch (e) {
    console.warn('Session storage write error:', e);
  }
  return counterName;
};

/**
 * Clears active counter from session storage
 */
export const clearActiveCounter = () => {
  try {
    sessionStorage.removeItem(COUNTER_SESSION_KEY);
  } catch (e) {
    console.warn('Session storage clear error:', e);
  }
};
