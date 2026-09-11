Component({
  properties: {
    title: { type: String, value: '还没有内容' },
    description: { type: String, value: '完成第一次运动后，这里会出现记录。' },
    actionText: { type: String, value: '' }
  },
  methods: {
    handleAction(this: any) {
      this.triggerEvent('action');
    }
  }
});
