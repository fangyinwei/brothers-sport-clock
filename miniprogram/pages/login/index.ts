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
      const session = await getApi().getSession();
      writeStorage(STORAGE_KEYS.profileCompleted, session.profileCompleted);
      wx.reLaunch({ url: session.profileCompleted ? '/pages/home/index' : '/pages/profile-setup/index' });
    } catch (_error) {
      const error = _error as { message?: string; statusCode?: number };
      // 只输出状态和服务端公共错误文本，避免在开发日志中泄露身份或凭据。
      console.warn('BroFit 登录请求失败', {
        statusCode: error?.statusCode,
        message: error?.message || 'unknown'
      });
      const title = error?.statusCode ? `登录失败（${error.statusCode}）` : '登录失败，请重试';
      wx.showToast({ title, icon: 'none' });
      this.setData({ loading: false });
    }
  }
});
