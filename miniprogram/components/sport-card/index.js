Component({
    properties: {
        title: { type: String, value: '' },
        subtitle: { type: String, value: '' },
        image: { type: String, value: '' },
        accent: { type: String, value: 'primary' }
    },
    methods: {
        handleTap() {
            this.triggerEvent('select');
        }
    }
});
