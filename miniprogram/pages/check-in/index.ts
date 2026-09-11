import { SportType } from '../../models/check-in';
import { getApi } from '../../services/api';
import { calculateCalories } from '../../utils/calories';
import { calculateCheckInScore } from '../../utils/scoring';

Page({
  data: {
    sport: 'gym' as SportType,
    duration: '45',
    distance: '',
    note: '',
    proofPath: '',
    estimatedCalories: 0,
    estimatedScore: 0,
    scoreBreakdown: null as any,
    submitting: false,
    result: null as any,
    sports: [
      { key: 'gym', label: '健身', icon: '\ue651', iconFont: true },
      { key: 'run', label: '跑步', icon: '\ue661', iconFont: true },
      { key: 'basketball', label: '篮球', icon: '\ue63d', iconFont: true },
      { key: 'pilates', label: '普拉提', icon: 'P', iconFont: false }
    ]
  },
  onLoad(options: any) {
    if (options && ['gym', 'run', 'basketball', 'pilates'].includes(options.sport)) this.setData({ sport: options.sport });
    this.refreshEstimate();
  },
  selectSport(event: any) {
    this.setData({ sport: event.currentTarget.dataset.sport }, () => this.refreshEstimate());
  },
  adjustDuration(event: any) {
    const delta = Number(event.currentTarget.dataset.delta) || 0;
    const next = Math.min(300, Math.max(5, (Number(this.data.duration) || 0) + delta));
    this.setData({ duration: String(next) }, () => this.refreshEstimate());
  },
  handleInput(event: any) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value }, () => this.refreshEstimate());
  },
  refreshEstimate() {
    const duration = Number(this.data.duration) || 0;
    const weight = 72;
    const calories = calculateCalories({ sport: this.data.sport, duration, distance: Number(this.data.distance) || 0, weight });
    const score = calculateCheckInScore({ sport: this.data.sport, duration, proofPath: this.data.proofPath }, calories);
    this.setData({ estimatedCalories: calories, estimatedScore: score.total, scoreBreakdown: score });
  },
  chooseProof() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (result: any) => {
        const originalPath = result.tempFiles[0].tempFilePath;
        const complete = (proofPath: string) => this.setData({ proofPath }, () => this.refreshEstimate());
        const compressImage = (wx as any).compressImage;
        if (typeof compressImage !== 'function') {
          complete(originalPath);
          return;
        }
        compressImage({
          src: originalPath,
          quality: 55,
          success: (compressed: any) => complete(compressed.tempFilePath || originalPath),
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
      const result = await getApi().createCheckIn({
        sport: this.data.sport,
        duration,
        distance: Number(this.data.distance) || undefined,
        note: this.data.note,
        proofPath: this.data.proofPath
      });
      this.setData({ result, submitting: false });
    } catch (_error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },
  closeResult() {
    wx.reLaunch({ url: '/pages/home/index' });
  }
});
