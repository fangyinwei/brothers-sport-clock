"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("../../utils/storage");
Page({
    data: {
        leaving: false,
        countdown: 3
    },
    onReady() {
        const hasProfile = (0, storage_1.readStorage)(storage_1.STORAGE_KEYS.profileCompleted, false);
        const timer = setInterval(() => {
            const next = this.data.countdown - 1;
            if (next <= 0)
                clearInterval(timer);
            this.setData({ countdown: Math.max(next, 0) });
        }, 500);
        setTimeout(() => {
            this.leave(hasProfile);
        }, 1800);
    },
    skip() {
        const hasProfile = (0, storage_1.readStorage)(storage_1.STORAGE_KEYS.profileCompleted, false);
        this.leave(hasProfile);
    },
    leave(hasProfile) {
        if (this.data.leaving)
            return;
        this.setData({ leaving: true });
        setTimeout(() => {
            const explicitMock = wx.getStorageSync('brofit:api-mode') === 'mock';
            const hasLogin = explicitMock ? hasProfile : (0, storage_1.hasValidLoginCache)();
            const url = hasLogin ? (hasProfile ? '/pages/home/index' : '/pages/profile-setup/index') : '/pages/login/index';
            wx.reLaunch({ url });
        }, 260);
    }
});
