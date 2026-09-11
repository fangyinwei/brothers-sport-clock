"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const storage_1 = require("../../utils/storage");
const STAT_ICONS = {
    score: '/assets/images/figma-profile-stat-score.png',
    count: '/assets/images/figma-profile-stat-count.png',
    calories: '/assets/images/figma-profile-stat-calories.png',
    streak: '/assets/images/figma-profile-stat-streak.png'
};
const HISTORY_IMAGES = {
    run: '/assets/images/figma-profile-history-run.png',
    gym: '/assets/images/figma-profile-history-gym.png',
    basketball: '/assets/images/figma-checkin-header.jpg',
    pilates: '/assets/images/figma-profile-history-yoga.png'
};
Page({
    data: {
        loading: true,
        session: null,
        home: null,
        badges: [
            { image: '/assets/images/figma-profile-badge-rookie.png', title: '初出茅庐', description: '完成1次运动' },
            { image: '/assets/images/figma-profile-badge-streak.png', title: '坚持一周', description: '连续打卡7天' },
            { image: '/assets/images/figma-profile-badge-burn.png', title: '燃脂达人', description: '累计消耗1,000卡' },
            { image: '/assets/images/figma-profile-badge-peak.png', title: '登峰向上', description: '累计运动50次' }
        ],
        weekStats: [],
        recentCheckins: []
    },
    onShow() {
        this.loadProfile();
    },
    async loadProfile() {
        this.setData({ loading: true });
        const api = (0, api_1.getApi)();
        const session = await api.getSession();
        const home = await api.getHomeData(session.groupId);
        const weekStats = [
            { icon: STAT_ICONS.score, value: home.stats.weeklyScore, label: '积分' },
            { icon: STAT_ICONS.count, value: home.stats.checkInDays, label: '运动次数' },
            { icon: STAT_ICONS.calories, value: home.stats.weeklyCalories, label: '消耗卡路里' },
            { icon: STAT_ICONS.streak, value: home.stats.streakDays, label: '连续打卡' }
        ];
        const recentCheckins = home.activities
            .slice(0, 3)
            .map((activity) => ({
            id: activity.id,
            title: activity.sport === 'run' ? '户外跑步' : activity.sport === 'gym' ? '力量训练' : activity.sport === 'pilates' ? '普拉提' : '篮球运动',
            detail: activity.detail.replace(' · ', '  '),
            date: activity.createdAt,
            image: HISTORY_IMAGES[activity.sport]
        }));
        this.setData({ session, home, weekStats, recentCheckins, loading: false });
    },
    editProfile() {
        wx.navigateTo({ url: '/pages/profile-setup/index' });
    },
    goCheckIn() {
        wx.navigateTo({ url: '/pages/check-in/index' });
    },
    showDetails() {
        wx.navigateTo({ url: '/pages/ranking/index' });
    },
    logout() {
        wx.showModal({
            title: '退出登录',
            content: '退出后会清除本机的演示资料和运动记录。',
            confirmText: '退出',
            confirmColor: '#B42318',
            success: (result) => {
                if (!result.confirm)
                    return;
                (0, storage_1.removeStorage)(storage_1.STORAGE_KEYS.state);
                (0, storage_1.removeStorage)(storage_1.STORAGE_KEYS.currentUser);
                (0, storage_1.removeStorage)(storage_1.STORAGE_KEYS.profileCompleted);
                wx.removeStorageSync('brofit:active-tab');
                wx.reLaunch({ url: '/pages/login/index' });
            }
        });
    },
    showSettings() {
        wx.showActionSheet({ itemList: ['提醒设置', '关于 BroFit'] });
    }
});
