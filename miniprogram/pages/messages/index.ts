import { Message } from '../../models/notification';
import { getApi } from '../../services/api';
import { formatRelativeTime } from '../../utils/format';

type MessageVisual = 'rank' | 'challenge' | 'invite';

interface DisplayMessage extends Message {
  visual: MessageVisual;
  timeLabel: string;
  avatar: string;
}

Page({
  data: {
    loading: true,
    messages: [] as DisplayMessage[],
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
        getApi().getMessages(),
        getApi().getHomeData('group-brofit')
      ]);
      this.setData({
        messages: messages.map((message) => this.toDisplayMessage(message)),
        currentUserId: home.session.id,
        streakDays: home.stats.streakDays,
        loading: false
      });
    } catch (_error) {
      this.setData({ loading: false });
      wx.showToast({ title: '消息加载失败', icon: 'none' });
    }
  },
  toDisplayMessage(message: Message): DisplayMessage {
    const visual: MessageVisual = message.type === 'rank' ? 'rank' : message.type === 'challenge' ? 'challenge' : 'invite';
    const avatar = visual === 'rank'
      ? '/assets/images/figma-messages-avatar-rank.png'
      : visual === 'challenge'
        ? '/assets/images/figma-messages-avatar-challenge.png'
        : '/assets/images/figma-messages-avatar-invite.png';
    return { ...message, visual, avatar, timeLabel: formatRelativeTime(message.createdAt) };
  },
  async sendQuickNudge(event: any) {
    const home = await getApi().getHomeData('group-brofit');
    const members = home.group.members.filter((member) => member.id !== home.session.id);
    wx.showActionSheet({
      itemList: members.map((member) => member.nickname),
      success: async (result: any) => {
        const target = members[result.tapIndex];
        if (!target) return;
        await getApi().sendNudge({ targetUserId: target.id, template: event.currentTarget.dataset.template });
        this.loadMessages();
      }
    });
  },
  async respondToMessage(event: any) {
    const targetUserId = event.currentTarget.dataset.userId as string;
    if (!targetUserId || targetUserId === this.data.currentUserId) {
      wx.showToast({ title: '已收到这份支持', icon: 'none' });
      return;
    }
    await getApi().sendNudge({ targetUserId, template: '一起继续加油！' });
    this.loadMessages();
  },
  markAllRead() {
    this.setData({ messages: this.data.messages.map((message: DisplayMessage) => ({ ...message, read: true })) });
    wx.showToast({ title: '已全部标为已读', icon: 'none' });
  },
  goCheckIn() {
    wx.navigateTo({ url: '/pages/check-in/index' });
  }
});
