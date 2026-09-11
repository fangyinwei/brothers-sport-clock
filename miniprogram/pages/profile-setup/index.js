"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const FIGMA_AVATAR = '/assets/images/figma-edit-profile-avatar.png';
Page({
    data: {
        nickname: '阿泽',
        avatar: FIGMA_AVATAR,
        avatarFileId: '',
        height: '170',
        weight: '72',
        experience: 'regular',
        saving: false
    },
    onLoad() {
        this.loadProfile();
    },
    async loadProfile() {
        try {
            const session = await (0, api_1.getApi)().getSession();
            this.setData({
                nickname: session.user.nickname,
                avatar: session.user.avatar || FIGMA_AVATAR,
                avatarFileId: session.user.avatarFileId || '',
                height: String(session.user.height),
                weight: String(session.user.weight),
                experience: session.user.experience
            });
        }
        catch (_error) {
            wx.showToast({ title: '资料加载失败', icon: 'none' });
        }
    },
    handleInput(event) {
        this.setData({ [event.currentTarget.dataset.field]: event.detail.value });
    },
    chooseAvatar() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (result) => this.setData({ avatar: result.tempFiles[0].tempFilePath, avatarFileId: '' })
        });
    },
    goBack() {
        wx.navigateBack({
            delta: 1,
            fail: () => wx.reLaunch({ url: '/pages/profile/index' })
        });
    },
    async handleSubmit() {
        const nickname = this.data.nickname.trim();
        const height = Number(this.data.height);
        const weight = Number(this.data.weight);
        if (!nickname) {
            wx.showToast({ title: '请输入昵称', icon: 'none' });
            return;
        }
        if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(weight) || weight <= 0) {
            wx.showToast({ title: '请填写有效的身高和体重', icon: 'none' });
            return;
        }
        this.setData({ saving: true });
        try {
            const avatar = this.data.avatarFileId || (this.data.avatar.startsWith('cloud://') ? this.data.avatar : undefined);
            await (0, api_1.getApi)().updateProfile({ nickname, avatar, height, weight, experience: this.data.experience });
            wx.showToast({ title: '资料已保存', icon: 'success' });
            setTimeout(() => wx.reLaunch({ url: '/pages/home/index' }), 600);
        }
        catch (_error) {
            this.setData({ saving: false });
            wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        }
    }
});
