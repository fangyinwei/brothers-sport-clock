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
    async requestWechatReminder(config) {
        if (!config.enabled || !config.templateId || typeof wx.requestSubscribeMessage !== 'function')
            return;
        try {
            await new Promise((resolve, reject) => {
                wx.requestSubscribeMessage({ tmplIds: [config.templateId], success: resolve, fail: reject });
            });
        }
        catch (_error) {
            // 用户拒绝、当前版本不支持或平台暂不可用时，均不影响登录主流程。
        }
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
            const api = (0, api_1.getApi)();
            const [session, subscribeConfig] = await Promise.all([api.getSession(), api.getSubscribeConfig()]);
            await this.requestWechatReminder(subscribeConfig);
            (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.profileCompleted, session.profileCompleted);
            (0, storage_1.cacheLoginForOneWeek)();
            wx.reLaunch({ url: session.profileCompleted ? '/pages/home/index' : '/pages/profile-setup/index' });
        }
        catch (_error) {
            const error = _error;
            // 只输出状态和服务端公共错误文本，避免在开发日志中泄露身份或凭据。
            console.warn('BroFit 登录请求失败', {
                statusCode: error === null || error === void 0 ? void 0 : error.statusCode,
                message: (error === null || error === void 0 ? void 0 : error.message) || 'unknown'
            });
            const title = (error === null || error === void 0 ? void 0 : error.statusCode) ? `登录失败（${error.statusCode}）` : '登录失败，请重试';
            wx.showToast({ title, icon: 'none' });
            this.setData({ loading: false });
        }
    }
});
