"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_1 = require("./config/cloud");
App({
    globalData: {
        appName: 'BroFit',
        apiMode: 'cloud'
    },
    onLaunch() {
        wx.setStorageSync('brofit:launched', true);
        if ((0, cloud_1.isCloudConfigured)() && wx.cloud && typeof wx.cloud.init === 'function') {
            wx.cloud.init({ env: cloud_1.CLOUD_CONFIG.envId, traceUser: true });
        }
        else if (!(0, cloud_1.isCloudConfigured)()) {
            console.info('微信云托管未配置：请填写 miniprogram/config/cloud.ts');
        }
        const loadFontFace = wx.loadFontFace;
        if (typeof loadFontFace === 'function') {
            loadFontFace({
                family: 'iconfont',
                source: 'url("https://at.alicdn.com/t/c/font_5232768_4sq7pgqtuc3.woff2?t=1789093880328")',
                global: true
            });
        }
    }
});
