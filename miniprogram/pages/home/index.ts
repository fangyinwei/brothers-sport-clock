import { Activity, HomeData } from '../../models/group';
import { getApi } from '../../services/api';

interface DisplayActivity extends Activity {
  sportLabel: string;
  encouragement: string;
  likes: number;
  avatar: string;
}

const activityCopy: Record<Activity['sport'], { encouragement: string; likes: number }> = {
  gym: { encouragement: '自律的人最酷', likes: 3 },
  run: { encouragement: '流汗的感觉真好', likes: 5 },
  basketball: { encouragement: '身心都轻松了~', likes: 4 },
  pilates: { encouragement: '每一次拉伸都更靠近自己', likes: 4 }
};

const sportLabels: Record<Activity['sport'], string> = {
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

Page({
  data: {
    loading: true,
    error: '',
    home: null as HomeData | null,
    activeTab: 'home',
    displayActivities: [] as DisplayActivity[],
    showcaseMembers: [
      { nickname: '阿泽', streak: 4, avatar: '/assets/images/figma-home-member-az.png', leader: true },
      { nickname: '小雨', streak: 3, avatar: '/assets/images/figma-home-member-xiaoyu.png', leader: false },
      { nickname: '阿凯', streak: 2, avatar: '/assets/images/figma-home-member-akai.png', leader: false },
      { nickname: '思雨', streak: 1, avatar: '/assets/images/figma-home-member-siyu.png', leader: false }
    ]
  },
  onLoad(options: Record<string, string>) {
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
      const home = await getApi().getHomeData('group-brofit');
      const displayActivities = home.activities.slice(0, 3).map((activity, index): DisplayActivity => {
        const copy = activityCopy[activity.sport];
        return {
          ...activity,
          sportLabel: `${activity.detail.split(' · ')[0]}${sportLabels[activity.sport]}`,
          encouragement: copy.encouragement,
          likes: copy.likes,
          avatar: figmaActivityAvatars[index] || activity.user.avatar
        };
      });
      this.setData({ home, displayActivities, loading: false });
    } catch (_error) {
      this.setData({ loading: false, error: '首页数据加载失败' });
    }
  },
  goCheckIn() {
    wx.navigateTo({ url: '/pages/check-in/index' });
  },
  goRanking() {
    wx.navigateTo({ url: '/pages/ranking/index' });
  },
  retry() {
    this.loadHome();
  }
});
