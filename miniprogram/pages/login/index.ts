import { getApi } from '../../services/api';
import { healthCheck } from '../../services/cloud-api';
import { STORAGE_KEYS, writeStorage } from '../../utils/storage';

type CloudStatus = 'checking' | 'connected' | 'unavailable';

Page({
  data: {
    loading: false,
    agreed: false,
    cloudStatus: 'checking' as CloudStatus,
    cloudStatusText: '正在检测云服务…'
  },
  onLoad() {
    this.checkCloudHealth();
  },
  async checkCloudHealth() {
    this.setData({ cloudStatus: 'checking', cloudStatusText: '正在检测云服务…' });
    try {
      await healthCheck();
      this.setData({ cloudStatus: 'connected', cloudStatusText: '云服务已连接' });
    } catch (error) {
      console.warn('微信云托管健康检查失败', error);
      this.setData({ cloudStatus: 'unavailable', cloudStatusText: '云服务暂不可用' });
    }
  },
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },
  async handleLogin() {
    if (this.data.loading) return;
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意相关协议', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      await new Promise<void>((resolve) => {
        if (typeof wx.login !== 'function') {
          resolve();
          return;
        }
        wx.login({
          success: (result: any) => {
            if (result && result.code) wx.setStorageSync('brofit:wx-login-code', result.code);
            resolve();
          },
          fail: () => resolve()
        });
      });
      await getApi().getSession();
      writeStorage(STORAGE_KEYS.profileCompleted, true);
      wx.reLaunch({ url: '/pages/home/index' });
    } catch (_error) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  }
});
