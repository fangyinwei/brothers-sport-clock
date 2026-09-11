"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const sportLabels = {
    gym: '力量训练',
    run: '跑步',
    basketball: '篮球',
    pilates: '普拉提'
};
const figmaActivityAvatars = [
    '/assets/images/figma-home-member-akai.png',
    '/assets/images/figma-home-member-xiaoyu.png',
    '/assets/images/figma-home-member-siyu.png'
];
const DEFAULT_MEMBER_AVATAR = '/assets/images/figma-home-member-az.png';
Page({
    data: {
        loading: true,
        error: '',
        home: null,
        activeTab: 'home',
        displayActivities: [],
        likingActivityId: '',
        groupMembers: [],
        challengeProgress: 0,
        challengeRemainingText: ''
    },
    onLoad(options) {
        if (options && (options.activeTab === 'home' || options.activeTab === 'sport')) {
            this.setData({ activeTab: options.activeTab });
            wx.setStorageSync('brofit:active-tab', options.activeTab);
        }
    },
    onShow() {
        const storedTab = wx.getStorageSync('brofit:active-tab');
        this.setData({ activeTab: storedTab === 'sport' ? 'sport' : 'home' });
        this.loadHome();
    },
    onPullDownRefresh() {
        this.loadHome().finally(() => wx.stopPullDownRefresh());
    },
    async loadHome() {
        this.setData({ loading: true, error: '' });
        try {
            const home = await (0, api_1.getApi)().getHomeData('group-brofit');
            const challenge = home.group.challenge;
            const challengeProgress = challenge.target > 0
                ? Math.min(100, Math.round((challenge.current / challenge.target) * 100))
                : 0;
            const remaining = Math.max(0, challenge.target - challenge.current);
            const groupMembers = home.group.members.map((member) => ({
                id: member.id,
                nickname: member.nickname,
                streak: member.stats.streakDays,
                avatar: member.avatar || DEFAULT_MEMBER_AVATAR,
                leader: member.stats.rank === 1
            }));
            const displayActivities = home.activities.slice(0, 3).map((activity, index) => {
                return {
                    ...activity,
                    sportLabel: `${activity.detail.split(' · ')[0]}${sportLabels[activity.sport]}`,
                    avatar: figmaActivityAvatars[index] || activity.user.avatar,
                    likes: Number(activity.likes) || 0,
                    liked: Boolean(activity.liked)
                };
            });
            this.setData({
                home,
                groupMembers,
                challengeProgress,
                challengeRemainingText: remaining > 0 ? `还差 ${remaining} ${challenge.unit}` : '挑战已完成！',
                displayActivities,
                loading: false
            });
        }
        catch (_error) {
            this.setData({ loading: false, error: '首页数据加载失败' });
        }
    },
    goCheckIn() {
        wx.navigateTo({ url: '/pages/check-in/index' });
    },
    goRanking() {
        wx.navigateTo({ url: '/pages/ranking/index' });
    },
    async toggleLike(event) {
        const id = event.currentTarget.dataset.id;
        if (!id || this.data.likingActivityId)
            return;
        this.setData({ likingActivityId: id });
        try {
            const result = await (0, api_1.getApi)().toggleCheckInLike(id);
            const displayActivities = this.data.displayActivities.map((activity) => (activity.id === id ? { ...activity, liked: result.liked, likes: result.likes } : activity));
            this.setData({ displayActivities });
        }
        catch (_error) {
            wx.showToast({ title: '点赞失败，请重试', icon: 'none' });
        }
        finally {
            this.setData({ likingActivityId: '' });
        }
    },
    retry() {
        this.loadHome();
    }
});
