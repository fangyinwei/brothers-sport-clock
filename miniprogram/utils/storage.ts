export const STORAGE_KEYS = {
  state: 'brofit:mock-state',
  currentUser: 'brofit:current-user',
  profileCompleted: 'brofit:profile-completed'
} as const;

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
