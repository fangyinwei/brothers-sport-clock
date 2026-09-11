Component({
    properties: {
        entries: { type: Array, value: [] }
    },
    methods: {
        handleTap(event) {
            this.triggerEvent('membertap', { user: event.currentTarget.dataset.user });
        }
    }
});
