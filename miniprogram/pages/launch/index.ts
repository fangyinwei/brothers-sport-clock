Page({
  data: {
    leaving: false,
    countdown: 3
  },
  onReady() {
    const hasProfile = wx.getStorageSync('brofit:profile-completed');
    const timer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) clearInterval(timer);
      this.setData({ countdown: Math.max(next, 0) });
    }, 500);
    setTimeout(() => {
      this.leave(hasProfile);
    }, 1800);
  },
  skip() {
    const hasProfile = wx.getStorageSync('brofit:profile-completed');
    this.leave(hasProfile);
  },
  leave(hasProfile: boolean) {
    if (this.data.leaving) return;
    this.setData({ leaving: true });
    setTimeout(() => {
      wx.reLaunch({ url: hasProfile ? '/pages/home/index' : '/pages/login/index' });
    }, 260);
  }
});
