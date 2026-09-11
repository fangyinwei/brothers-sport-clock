export const STORAGE_KEYS = {
  state: 'brofit:mock-state',
  currentUser: 'brofit:current-user',
  profileCompleted: 'brofit:profile-completed',
  loginExpiresAt: 'brofit:login-expires-at'
} as const;

const LOGIN_CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = wx.getStorageSync(key);
    return value === '' || value === undefined || value === null ? fallback : (value as T);
  } catch (_error) {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  wx.setStorageSync(key, value);
}

export function removeStorage(key: string): void {
  wx.removeStorageSync(key);
}

/** Records local login consent for one week; server APIs still validate WeChat identity per request. */
export function cacheLoginForOneWeek(now = Date.now()): void {
  writeStorage(STORAGE_KEYS.loginExpiresAt, now + LOGIN_CACHE_DURATION_MS);
}

export function hasValidLoginCache(now = Date.now()): boolean {
  const expiresAt = Number(readStorage(STORAGE_KEYS.loginExpiresAt, 0));
  if (Number.isFinite(expiresAt) && expiresAt > now) return true;
  removeStorage(STORAGE_KEYS.loginExpiresAt);
  return false;
}
