"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const calories_1 = require("../../utils/calories");
const scoring_1 = require("../../utils/scoring");
Page({
    data: {
        sport: 'pilates',
        duration: '45',
        distance: '',
        note: '',
        proofPath: '',
        estimatedCalories: 0,
        estimatedScore: 0,
        scoreBreakdown: null,
        submitting: false,
        result: null,
        sports: [
            { key: 'gym', label: '健身', icon: '\ue651', iconFont: true },
            { key: 'run', label: '跑步', icon: '\ue661', iconFont: true },
            { key: 'basketball', label: '篮球', icon: '\ue63d', iconFont: true },
            { key: 'pilates', label: '普拉提', icon: 'P', iconFont: false }
        ]
    },
    onLoad(options) {
        if (options && ['gym', 'run', 'basketball', 'pilates'].includes(options.sport))
            this.setData({ sport: options.sport });
        this.refreshEstimate();
    },
    selectSport(event) {
        this.setData({ sport: event.currentTarget.dataset.sport }, () => this.refreshEstimate());
    },
    adjustDuration(event) {
        const delta = Number(event.currentTarget.dataset.delta) || 0;
        const next = Math.min(300, Math.max(5, (Number(this.data.duration) || 0) + delta));
        this.setData({ duration: String(next) }, () => this.refreshEstimate());
    },
    handleInput(event) {
        const field = event.currentTarget.dataset.field;
        this.setData({ [field]: event.detail.value }, () => this.refreshEstimate());
    },
    refreshEstimate() {
        const duration = Number(this.data.duration) || 0;
        const weight = 72;
        const calories = (0, calories_1.calculateCalories)({ sport: this.data.sport, duration, distance: Number(this.data.distance) || 0, weight });
        const score = (0, scoring_1.calculateCheckInScore)({ sport: this.data.sport, duration, proofPath: this.data.proofPath }, calories);
        this.setData({ estimatedCalories: calories, estimatedScore: score.total, scoreBreakdown: score });
    },
    chooseProof() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (result) => {
                const originalPath = result.tempFiles[0].tempFilePath;
                const complete = (proofPath) => this.setData({ proofPath }, () => this.refreshEstimate());
                const compressImage = wx.compressImage;
                if (typeof compressImage !== 'function') {
                    complete(originalPath);
                    return;
                }
                compressImage({
                    src: originalPath,
                    quality: 55,
                    success: (compressed) => complete(compressed.tempFilePath || originalPath),
                    fail: () => complete(originalPath)
                });
            }
        });
    },
    removeProof() {
        this.setData({ proofPath: '' }, () => this.refreshEstimate());
    },
    async handleSubmit() {
        const duration = Number(this.data.duration);
        if (!duration || duration <= 0) {
            wx.showToast({ title: '先填运动时长', icon: 'none' });
            return;
        }
        if (!this.data.proofPath) {
            wx.showToast({ title: '上传一张运动凭证吧', icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            const result = await (0, api_1.getApi)().createCheckIn({
                sport: this.data.sport,
                duration,
                distance: Number(this.data.distance) || undefined,
                note: this.data.note,
                proofPath: this.data.proofPath
            });
            this.setData({ result, submitting: false });
        }
        catch (_error) {
            this.setData({ submitting: false });
            wx.showToast({ title: '提交失败，请重试', icon: 'none' });
        }
    },
    closeResult() {
        wx.reLaunch({ url: '/pages/home/index' });
    }
});
