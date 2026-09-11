Component({
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    showSearch: { type: Boolean, value: false },
    dark: { type: Boolean, value: false },
    transparent: { type: Boolean, value: false },
    alignLeft: { type: Boolean, value: false },
    largeTitle: { type: Boolean, value: false }
  },
  methods: {
    handleBack(this: any) {
      const pages = getCurrentPages();
      if (pages.length > 1) wx.navigateBack();
      else wx.reLaunch({ url: '/pages/home/index' });
    },
    handleSearch(this: any) {
      this.triggerEvent('search');
    }
  }
});
