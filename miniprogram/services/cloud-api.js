"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudContainerError = void 0;
exports.healthCheck = healthCheck;
exports.createCloudApi = createCloudApi;
const cloud_1 = require("../config/cloud");
class CloudContainerError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'CloudContainerError';
    }
}
exports.CloudContainerError = CloudContainerError;
function assertCloudConfiguration() {
    if (!(0, cloud_1.isCloudConfigured)()) {
        throw new CloudContainerError('微信云托管尚未配置环境 ID 或服务名');
    }
    if (!wx.cloud || typeof wx.cloud.callContainer !== 'function') {
        throw new CloudContainerError('当前运行环境不支持微信云托管调用');
    }
}
async function request(path, options = {}) {
    assertCloudConfiguration();
    const response = await wx.cloud.callContainer({
        config: { env: cloud_1.CLOUD_CONFIG.envId },
        path,
        method: options.method || 'GET',
        data: options.data,
        timeout: cloud_1.CLOUD_CONFIG.timeout,
        header: {
            'content-type': 'application/json',
            'X-WX-SERVICE': cloud_1.CLOUD_CONFIG.serviceName,
            ...(options.header || {})
        }
    });
    const statusCode = Number(response && response.statusCode);
    if (statusCode >= 200 && statusCode < 300)
        return response.data;
    throw new CloudContainerError(`云服务请求失败：${statusCode || 'unknown'}`, statusCode || undefined);
}
async function healthCheck() {
    const health = await request('/health');
    if (health.status !== 'ok' || !Number.isFinite(Date.parse(health.timestamp))) {
        throw new CloudContainerError('云服务健康检查返回格式无效');
    }
    return health;
}
function withQuery(path, query) {
    const search = Object.keys(query)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&');
    return `${path}?${search}`;
}
function createCloudApi() {
    return {
        getSession: () => request('/api/v1/session'),
        getHomeData: (groupId) => request(withQuery('/api/v1/home', { groupId })),
        updateProfile: (input) => request('/api/v1/profile', { method: 'PATCH', data: input }),
        createCheckIn: (input) => request('/api/v1/check-ins', { method: 'POST', data: input }),
        getRankings: (input) => request(withQuery('/api/v1/rankings', { groupId: input.groupId, type: input.type })),
        getMessages: () => request('/api/v1/messages'),
        sendNudge: (input) => request('/api/v1/nudges', { method: 'POST', data: input })
    };
}
