"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const format_1 = require("../../utils/format");
Page({
    data: {
        loading: true,
        messages: [],
        currentUserId: '',
        streakDays: 0,
        quickActions: [
            { title: '加油', subtitle: '好友打气', template: '今天还没打卡', icon: '/assets/images/figma-messages-action-cheer.png' },
            { title: '一起动', subtitle: '邀请运动', template: '今晚一起完成挑战', icon: '/assets/images/figma-messages-action-invite.png' },
            { title: '冲榜', subtitle: '激励一下', template: '我在榜首等你', icon: '/assets/images/figma-messages-action-rank.png' },
            { title: '谢谢', subtitle: '回应支持', template: '别掉连胜', icon: '/assets/images/figma-messages-action-thanks.png' }
        ]
    },
    onShow() {
        this.loadMessages();
    },
    async loadMessages() {
        this.setData({ loading: true });
        try {
            const [messages, home] = await Promise.all([
                (0, api_1.getApi)().getMessages(),
                (0, api_1.getApi)().getHomeData('group-brofit')
            ]);
            this.setData({
                messages: messages.map((message) => this.toDisplayMessage(message)),
                currentUserId: home.session.id,
                streakDays: home.stats.streakDays,
                loading: false
            });
        }
        catch (_error) {
            this.setData({ loading: false });
            wx.showToast({ title: '消息加载失败', icon: 'none' });
        }
    },
    toDisplayMessage(message) {
        const visual = message.type === 'rank' ? 'rank' : message.type === 'challenge' ? 'challenge' : 'invite';
        const avatar = visual === 'rank'
            ? '/assets/images/figma-messages-avatar-rank.png'
            : visual === 'challenge'
                ? '/assets/images/figma-messages-avatar-challenge.png'
                : '/assets/images/figma-messages-avatar-invite.png';
        return { ...message, visual, avatar, timeLabel: (0, format_1.formatRelativeTime)(message.createdAt) };
    },
    async sendQuickNudge(event) {
        const home = await (0, api_1.getApi)().getHomeData('group-brofit');
        const members = home.group.members.filter((member) => member.id !== home.session.id);
        wx.showActionSheet({
            itemList: members.map((member) => member.nickname),
            success: async (result) => {
                const target = members[result.tapIndex];
                if (!target)
                    return;
                await (0, api_1.getApi)().sendNudge({ targetUserId: target.id, template: event.currentTarget.dataset.template });
                this.loadMessages();
            }
        });
    },
    async respondToMessage(event) {
        const targetUserId = event.currentTarget.dataset.userId;
        if (!targetUserId || targetUserId === this.data.currentUserId) {
            wx.showToast({ title: '已收到这份支持', icon: 'none' });
            return;
        }
        await (0, api_1.getApi)().sendNudge({ targetUserId, template: '一起继续加油！' });
        this.loadMessages();
    },
    async markAllRead() {
        try {
            await (0, api_1.getApi)().markAllMessagesRead();
            this.setData({ messages: this.data.messages.map((message) => ({ ...message, read: true })) });
            wx.showToast({ title: '已全部标为已读', icon: 'none' });
        }
        catch (_error) {
            wx.showToast({ title: '操作失败，请重试', icon: 'none' });
        }
    },
    goCheckIn() {
        wx.navigateTo({ url: '/pages/check-in/index' });
    }
});
