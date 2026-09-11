import { CLOUD_CONFIG, isCloudConfigured } from './config/cloud';

App({
  globalData: {
    appName: 'BroFit',
    apiMode: 'mock'
  },
  onLaunch() {
    wx.setStorageSync('brofit:launched', true);
    if (isCloudConfigured() && wx.cloud && typeof wx.cloud.init === 'function') {
      wx.cloud.init({ env: CLOUD_CONFIG.envId, traceUser: true });
    } else if (!isCloudConfigured()) {
      console.info('微信云托管未配置：请填写 miniprogram/config/cloud.ts');
    }
    const loadFontFace = (wx as any).loadFontFace;
    if (typeof loadFontFace === 'function') {
      loadFontFace({
        family: 'iconfont',
        source: 'url("https://at.alicdn.com/t/c/font_5232768_4sq7pgqtuc3.woff2?t=1789093880328")',
        global: true
      });
    }
  }
});
