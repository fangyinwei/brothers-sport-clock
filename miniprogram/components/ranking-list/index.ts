Component({
  properties: {
    entries: { type: Array, value: [] }
  },
  methods: {
    handleTap(this: any, event: any) {
      this.triggerEvent('membertap', { user: event.currentTarget.dataset.user });
    }
  }
});
