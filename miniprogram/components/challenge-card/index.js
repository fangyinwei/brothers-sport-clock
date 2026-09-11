Component({
    properties: {
        title: { type: String, value: '' },
        description: { type: String, value: '' },
        current: { type: Number, value: 0 },
        target: { type: Number, value: 0 },
        unit: { type: String, value: '' },
        reward: { type: String, value: '' },
        endsAt: { type: String, value: '' }
    },
    methods: {
        handleTap() {
            this.triggerEvent('tapchallenge');
        }
    }
});
