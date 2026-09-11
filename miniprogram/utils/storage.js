"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = void 0;
exports.readStorage = readStorage;
exports.writeStorage = writeStorage;
exports.removeStorage = removeStorage;
exports.STORAGE_KEYS = {
    state: 'brofit:mock-state',
    currentUser: 'brofit:current-user',
    profileCompleted: 'brofit:profile-completed'
};
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
