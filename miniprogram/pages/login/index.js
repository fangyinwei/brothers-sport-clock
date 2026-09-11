"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const cloud_api_1 = require("../../services/cloud-api");
const storage_1 = require("../../utils/storage");
Page({
    data: {
        loading: false,
        agreed: false,
        cloudStatus: 'checking',
        cloudStatusText: '正在检测云服务…'
    },
    onLoad() {
        this.checkCloudHealth();
    },
    async checkCloudHealth() {
        this.setData({ cloudStatus: 'checking', cloudStatusText: '正在检测云服务…' });
        try {
            await (0, cloud_api_1.healthCheck)();
            this.setData({ cloudStatus: 'connected', cloudStatusText: '云服务已连接' });
        }
        catch (error) {
            console.warn('微信云托管健康检查失败', error);
            this.setData({ cloudStatus: 'unavailable', cloudStatusText: '云服务暂不可用' });
        }
    },
    toggleAgreement() {
        this.setData({ agreed: !this.data.agreed });
    },
    async handleLogin() {
        if (this.data.loading)
            return;
        if (!this.data.agreed) {
            wx.showToast({ title: '请先阅读并同意相关协议', icon: 'none' });
            return;
        }
        this.setData({ loading: true });
        try {
            await new Promise((resolve) => {
                if (typeof wx.login !== 'function') {
                    resolve();
                    return;
                }
                wx.login({
                    success: (result) => {
                        if (result && result.code)
                            wx.setStorageSync('brofit:wx-login-code', result.code);
                        resolve();
                    },
                    fail: () => resolve()
                });
            });
            await (0, api_1.getApi)().getSession();
            (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.profileCompleted, true);
            wx.reLaunch({ url: '/pages/home/index' });
        }
        catch (_error) {
            wx.showToast({ title: '登录失败，请重试', icon: 'none' });
            this.setData({ loading: false });
        }
    }
});
