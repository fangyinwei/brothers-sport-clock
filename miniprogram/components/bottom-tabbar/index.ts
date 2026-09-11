Component({
  properties: {
    active: {
      type: String,
      value: 'home',
      observer(this: any, value: string) {
        this.syncActive(value);
      }
    }
  },
  data: {
    items: [
      { key: 'home', label: '首页', glyph: '\ue6c1', url: '/pages/home/index?activeTab=home' },
      { key: 'sport', label: '运动', glyph: '\ue661', url: '/pages/check-in/index' },
      { key: 'messages', label: '消息', glyph: '\ue6de', badge: true, url: '/pages/messages/index' },
      { key: 'profile', label: '我的', glyph: '\ue6e4', url: '/pages/profile/index' }
    ]
  },
  lifetimes: {
    attached(this: any) {
      this.syncActive(this.properties.active);
    }
  },
  methods: {
    syncActive(this: any, active: string) {
      if (!this.data || !this.data.items) return;
      const items = this.data.items.map((item: any) => {
        const selected = item.key === active;
        return {
          ...item,
          selected
        };
      });
      this.setData({ items });
    },
    handleTap(this: any, event: any) {
      const { url, key } = event.currentTarget.dataset;
      if (key === 'sport') {
        wx.navigateTo({ url });
        return;
      }
      if (key === this.properties.active) return;
      wx.setStorageSync('brofit:active-tab', key);
      wx.reLaunch({ url });
    }
  }
});
