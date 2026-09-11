"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
Page({
    data: {
        loading: true,
        error: '',
        ranking: null,
        activeType: 'score',
        types: [
            { key: 'score', label: '综合' },
            { key: 'calories', label: '卡路里' },
            { key: 'streak', label: '坚持' },
            { key: 'run', label: '跑步' },
            { key: 'gym', label: '健身' },
            { key: 'basketball', label: '篮球' },
            { key: 'pilates', label: '普拉提' }
        ]
    },
    onLoad() {
        this.loadRanking();
    },
    async loadRanking() {
        this.setData({ loading: true, error: '' });
        try {
            const ranking = await (0, api_1.getApi)().getRankings({ groupId: 'group-brofit', type: this.data.activeType });
            this.setData({ ranking, loading: false });
        }
        catch (_error) {
            this.setData({ loading: false, error: '排行榜加载失败' });
        }
    },
    switchType(event) {
        this.setData({ activeType: event.currentTarget.dataset.type }, () => this.loadRanking());
    },
    memberTap(event) {
        wx.showToast({ title: `${event.detail.user.nickname} 本周很能打`, icon: 'none' });
    },
    retry() {
        this.loadRanking();
    }
});
