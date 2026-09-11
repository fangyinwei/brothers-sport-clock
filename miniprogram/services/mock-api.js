"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockApi = createMockApi;
const calories_1 = require("../utils/calories");
const scoring_1 = require("../utils/scoring");
const format_1 = require("../utils/format");
const storage_1 = require("../utils/storage");
const AVATARS = [
    '/assets/images/training-card-2.jpg',
    '/assets/images/training-card-1.jpg',
    '/assets/images/training-card-3.jpg',
    '/assets/images/training-card-4.jpg',
    '/assets/images/training-card-5.jpg'
];
const seedUsers = [
    { id: 'u-001', nickname: '阿泽', avatar: AVATARS[0], height: 178, weight: 72, experience: 'regular', stats: emptyStats() },
    { id: 'u-002', nickname: '老周', avatar: AVATARS[1], height: 175, weight: 76, experience: 'advanced', stats: emptyStats() },
    { id: 'u-003', nickname: '小齐', avatar: AVATARS[2], height: 181, weight: 70, experience: 'regular', stats: emptyStats() },
    { id: 'u-004', nickname: '大刘', avatar: AVATARS[3], height: 183, weight: 82, experience: 'beginner', stats: emptyStats() },
    { id: 'u-005', nickname: '阿凯', avatar: AVATARS[4], height: 172, weight: 68, experience: 'advanced', stats: emptyStats() }
];
function emptyStats() {
    return { weeklyScore: 0, weeklyCalories: 0, weeklyMinutes: 0, streakDays: 0, rank: 0, checkInDays: 0 };
}
function createSeedCheckIns() {
    const now = new Date();
    const items = [
        ['u-001', { sport: 'gym', duration: 48, trainingType: '力量训练', bodyPart: '肩部', proofPath: AVATARS[0] }, 2],
        ['u-002', { sport: 'run', duration: 36, distance: 5.8, proofPath: AVATARS[1] }, 1],
        ['u-003', { sport: 'basketball', duration: 70, note: '晚间球局', proofPath: AVATARS[2] }, 1],
        ['u-004', { sport: 'gym', duration: 32, trainingType: 'HIIT', bodyPart: '全身', proofPath: AVATARS[3] }, 0],
        ['u-005', { sport: 'run', duration: 44, distance: 6.2, proofPath: AVATARS[4] }, 0],
        ['u-001', { sport: 'basketball', duration: 55, note: '周末三对三', proofPath: AVATARS[2] }, -1],
        ['u-002', { sport: 'gym', duration: 62, trainingType: '器械训练', bodyPart: '胸部', proofPath: AVATARS[0] }, -2],
        ['u-003', { sport: 'run', duration: 28, distance: 4.1, proofPath: AVATARS[1] }, -2]
    ];
    return items.map(([userId, input, dayOffset], index) => {
        const created = new Date(now);
        created.setDate(created.getDate() + dayOffset);
        const user = seedUsers.find((item) => item.id === userId) || seedUsers[0];
        const calories = (0, calories_1.calculateCalories)({ ...input, weight: user.weight });
        const scoreBreakdown = (0, scoring_1.calculateCheckInScore)(input, calories);
        return {
            ...input,
            id: `checkin-${index + 1}`,
            userId,
            createdAt: created.toISOString(),
            calories,
            score: scoreBreakdown.total,
            scoreBreakdown,
            status: 'valid'
        };
    });
}
function defaultState() {
    return {
        currentUserId: 'u-001',
        users: seedUsers,
        checkIns: createSeedCheckIns(),
        likesByCheckIn: {},
        messages: [
            { id: 'm-1', type: 'rank', title: '排名有变化', content: '老周刚刚超过你，差 18 分。', fromUserId: 'u-002', fromNickname: '老周', createdAt: new Date(Date.now() - 25 * 60000).toISOString(), read: false, actionLabel: '去看看' },
            { id: 'm-2', type: 'nudge', title: '阿泽提醒你', content: '今天还没打卡，别掉连胜。', fromUserId: 'u-001', fromNickname: '阿泽', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), read: false, actionLabel: '立即打卡' },
            { id: 'm-3', type: 'challenge', title: '周挑战进度更新', content: '全组累计完成 68%，还差 420 千卡。', createdAt: new Date(Date.now() - 7 * 3600000).toISOString(), read: true }
        ]
    };
}
function getState() {
    const saved = (0, storage_1.readStorage)(storage_1.STORAGE_KEYS.state, null);
    if (saved)
        return { ...saved, likesByCheckIn: saved.likesByCheckIn || {} };
    const initial = defaultState();
    (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.state, initial);
    return initial;
}
function saveState(state) {
    (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.state, state);
}
function refreshStats(state) {
    const days = (0, format_1.getWeekDays)();
    state.users.forEach((user) => {
        const own = state.checkIns.filter((checkIn) => checkIn.userId === user.id && checkIn.status === 'valid');
        const weekly = own.filter((checkIn) => days.some((day) => day.key === (0, format_1.dateKey)(new Date(checkIn.createdAt))));
        const dates = new Set(weekly.map((checkIn) => (0, format_1.dateKey)(new Date(checkIn.createdAt))));
        const score = weekly.reduce((sum, item) => sum + item.score, 0);
        const calories = weekly.reduce((sum, item) => sum + item.calories, 0);
        const minutes = weekly.reduce((sum, item) => sum + item.duration, 0);
        user.stats = { weeklyScore: score + (0, scoring_1.getStreakBonus)(dates.size), weeklyCalories: calories, weeklyMinutes: minutes, streakDays: dates.size, rank: 0, checkInDays: dates.size };
    });
    const ordered = [...state.users].sort((a, b) => b.stats.weeklyScore - a.stats.weeklyScore);
    ordered.forEach((user, index) => { user.stats.rank = index + 1; });
}
function groupFor(state) {
    refreshStats(state);
    const current = state.users.find((user) => user.id === state.currentUserId) || state.users[0];
    const valid = state.checkIns.filter((item) => item.status === 'valid');
    const currentCalories = valid.reduce((sum, item) => sum + item.calories, 0);
    return {
        id: 'group-brofit',
        name: '兄弟运动局',
        inviteCode: 'BROFIT5',
        memberIds: state.users.map((user) => user.id),
        members: state.users,
        weeklyGoal: 5000,
        challenge: {
            id: 'challenge-001',
            title: '本周全组燃脂挑战',
            description: '全组累计消耗 5000 千卡，完成后解锁“燃动小队”称号。',
            target: 5000,
            current: currentCalories,
            unit: '千卡',
            endsAt: '本周日 23:59',
            reward: '燃动小队称号'
        }
    };
}
function buildCalendar(state) {
    const current = state.currentUserId;
    const ownDates = new Set(state.checkIns.filter((item) => item.userId === current && item.status === 'valid').map((item) => (0, format_1.dateKey)(new Date(item.createdAt))));
    return (0, format_1.getWeekDays)().map((day) => ({ ...day, completed: ownDates.has(day.key) }));
}
function buildActivities(state) {
    return [...state.checkIns]
        .filter((item) => item.status === 'valid')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((item) => {
        const user = state.users.find((candidate) => candidate.id === item.userId) || state.users[0];
        const sportName = item.sport === 'gym' ? '健身' : item.sport === 'run' ? '跑步' : item.sport === 'pilates' ? '普拉提' : '篮球';
        const likes = state.likesByCheckIn[item.id] || [];
        return {
            id: item.id,
            user,
            sport: item.sport,
            title: `${user.nickname} 完成了${sportName}打卡`,
            detail: `${(0, format_1.formatDuration)(item.duration)} · ${item.calories} 千卡`,
            score: item.score,
            createdAt: (0, format_1.formatRelativeTime)(item.createdAt),
            proofPath: item.proofPath,
            likes: likes.length,
            liked: likes.includes(state.currentUserId)
        };
    });
}
function rankingData(state, type) {
    refreshStats(state);
    const meta = {
        score: { title: '综合积分榜', unit: '分' },
        calories: { title: '卡路里消耗榜', unit: '千卡' },
        streak: { title: '坚持天数榜', unit: '天' },
        gym: { title: '健身时长榜', unit: '分钟' },
        run: { title: '跑步距离榜', unit: '公里' },
        basketball: { title: '篮球时长榜', unit: '分钟' },
        pilates: { title: '普拉提时长榜', unit: '分钟' }
    };
    const values = state.users.map((user) => {
        const own = state.checkIns.filter((item) => item.userId === user.id && item.status === 'valid');
        let value = 0;
        let detail = '';
        if (type === 'score') {
            value = user.stats.weeklyScore;
            detail = `${user.stats.checkInDays} 天有效打卡`;
        }
        if (type === 'calories') {
            value = user.stats.weeklyCalories;
            detail = `${user.stats.weeklyMinutes} 分钟运动`;
        }
        if (type === 'streak') {
            value = user.stats.streakDays;
            detail = `${user.stats.weeklyScore} 积分`;
        }
        if (type === 'gym') {
            value = own.filter((item) => item.sport === 'gym').reduce((sum, item) => sum + item.duration, 0);
            detail = '力量与体能训练';
        }
        if (type === 'run') {
            value = Number(own.filter((item) => item.sport === 'run').reduce((sum, item) => sum + (item.distance || 0), 0).toFixed(1));
            detail = '累计跑步距离';
        }
        if (type === 'basketball') {
            value = own.filter((item) => item.sport === 'basketball').reduce((sum, item) => sum + item.duration, 0);
            detail = '球场活跃时长';
        }
        if (type === 'pilates') {
            value = own.filter((item) => item.sport === 'pilates').reduce((sum, item) => sum + item.duration, 0);
            detail = '核心与柔韧训练';
        }
        return { user, value, detail };
    }).sort((a, b) => b.value - a.value);
    return {
        type,
        title: meta[type].title,
        unit: meta[type].unit,
        updatedAt: '刚刚更新',
        entries: values.map((item, index) => ({ rank: index + 1, user: item.user, value: item.value, unit: meta[type].unit, trend: index === 0 ? 0 : index % 2 === 0 ? -1 : 1, highlighted: item.user.id === state.currentUserId, detail: item.detail }))
    };
}
function createMockApi() {
    return {
        async getSession() {
            const state = getState();
            refreshStats(state);
            saveState(state);
            const user = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
            return { authenticated: true, user, groupId: 'group-brofit', profileCompleted: Boolean((0, storage_1.readStorage)(storage_1.STORAGE_KEYS.profileCompleted, false)) };
        },
        async getHomeData() {
            const state = getState();
            refreshStats(state);
            saveState(state);
            const user = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
            return { session: user, group: groupFor(state), calendar: buildCalendar(state), activities: buildActivities(state), stats: user.stats };
        },
        async updateProfile(input) {
            const state = getState();
            const user = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
            Object.assign(user, input);
            (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.profileCompleted, true);
            saveState(state);
            return user;
        },
        async createCheckIn(input) {
            const state = getState();
            const user = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
            const calories = (0, calories_1.calculateCalories)({ ...input, weight: user.weight });
            const scoreBreakdown = (0, scoring_1.calculateCheckInScore)(input, calories);
            const checkIn = { ...input, id: `checkin-${Date.now()}`, userId: user.id, createdAt: input.createdAt || new Date().toISOString(), calories, score: scoreBreakdown.total, scoreBreakdown, status: 'valid' };
            state.checkIns.push(checkIn);
            refreshStats(state);
            saveState(state);
            return { checkIn, rank: user.stats.rank, rankDelta: user.stats.rank <= 2 ? 1 : 0 };
        },
        async toggleCheckInLike(checkInId) {
            const state = getState();
            if (!state.checkIns.some((item) => item.id === checkInId && item.status === 'valid'))
                throw new Error('打卡记录不存在');
            const likes = state.likesByCheckIn[checkInId] || [];
            const currentIndex = likes.indexOf(state.currentUserId);
            const liked = currentIndex < 0;
            state.likesByCheckIn[checkInId] = liked
                ? [...likes, state.currentUserId]
                : likes.filter((id) => id !== state.currentUserId);
            saveState(state);
            return { liked, likes: state.likesByCheckIn[checkInId].length };
        },
        async getRankings(input) {
            return rankingData(getState(), input.type);
        },
        async getMessages() {
            return getState().messages;
        },
        async getSubscribeConfig() {
            return { enabled: false };
        },
        async markAllMessagesRead() {
            const state = getState();
            let updated = 0;
            state.messages = state.messages.map((message) => {
                if (message.read)
                    return message;
                updated += 1;
                return { ...message, read: true };
            });
            saveState(state);
            return { updated };
        },
        async sendNudge(input) {
            const state = getState();
            const sender = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
            const target = state.users.find((item) => item.id === input.targetUserId) || state.users[0];
            state.messages.unshift({ id: `m-${Date.now()}`, type: 'nudge', title: `${sender.nickname} 提醒你`, content: input.template, fromUserId: sender.id, fromNickname: sender.nickname, createdAt: new Date().toISOString(), read: false, actionLabel: '去打卡' });
            (0, storage_1.writeStorage)(storage_1.STORAGE_KEYS.state, state);
            wx.showToast({ title: `已提醒${target.nickname}`, icon: 'success' });
        }
    };
}
