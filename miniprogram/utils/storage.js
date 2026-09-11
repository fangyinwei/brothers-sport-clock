"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = void 0;
exports.readStorage = readStorage;
exports.writeStorage = writeStorage;
exports.removeStorage = removeStorage;
exports.cacheLoginForOneWeek = cacheLoginForOneWeek;
exports.hasValidLoginCache = hasValidLoginCache;
exports.STORAGE_KEYS = {
    state: 'brofit:mock-state',
    currentUser: 'brofit:current-user',
    profileCompleted: 'brofit:profile-completed',
    loginExpiresAt: 'brofit:login-expires-at'
};
const LOGIN_CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
function readStorage(key, fallback) {
    try {
        const value = wx.getStorageSync(key);
        return value === '' || value === undefined || value === null ? fallback : value;
    }
    catch (_error) {
        return fallback;
    }
}
function writeStorage(key, value) {
    wx.setStorageSync(key, value);
}
function removeStorage(key) {
    wx.removeStorageSync(key);
}
/** Records local login consent for one week; server APIs still validate WeChat identity per request. */
function cacheLoginForOneWeek(now = Date.now()) {
    writeStorage(exports.STORAGE_KEYS.loginExpiresAt, now + LOGIN_CACHE_DURATION_MS);
}
function hasValidLoginCache(now = Date.now()) {
    const expiresAt = Number(readStorage(exports.STORAGE_KEYS.loginExpiresAt, 0));
    if (Number.isFinite(expiresAt) && expiresAt > now)
        return true;
    removeStorage(exports.STORAGE_KEYS.loginExpiresAt);
    return false;
}
