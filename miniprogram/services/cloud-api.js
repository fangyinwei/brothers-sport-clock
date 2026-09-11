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
let sessionCache = null;
function assertCloudConfiguration() {
    if (!(0, cloud_1.isCloudConfigured)())
        throw new CloudContainerError('微信云托管尚未配置环境 ID 或服务名');
    if (!wx.cloud || typeof wx.cloud.callContainer !== 'function')
        throw new CloudContainerError('当前运行环境不支持微信云托管调用');
}
async function request(path, options = {}) {
    var _a, _b;
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
    const message = ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.message) || `云服务请求失败：${statusCode || 'unknown'}`;
    throw new CloudContainerError(message, statusCode || undefined);
}
async function healthCheck() {
    const health = await request('/health');
    if (health.status !== 'ok' || !Number.isFinite(Date.parse(health.timestamp)))
        throw new CloudContainerError('云服务健康检查返回格式无效');
    return health;
}
function withQuery(path, query) {
    const search = Object.keys(query)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&');
    return `${path}?${search}`;
}
function isCloudFileId(value) {
    return Boolean(value && value.startsWith('cloud://'));
}
function extensionOf(path) {
    var _a;
    const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(path);
    return ((_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'jpg';
}
async function uploadCurrentUserFile(localPath, kind) {
    if (isCloudFileId(localPath))
        return localPath;
    if (!wx.cloud || typeof wx.cloud.uploadFile !== 'function')
        throw new CloudContainerError('当前运行环境不支持 CloudBase 文件上传');
    const session = sessionCache || await loadSession();
    if (!session.uploadPrefix)
        throw new CloudContainerError('云服务未返回当前用户上传目录');
    const cloudPath = `${session.uploadPrefix}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionOf(localPath)}`;
    const result = await wx.cloud.uploadFile({ cloudPath, filePath: localPath });
    if (!(result === null || result === void 0 ? void 0 : result.fileID) || !isCloudFileId(result.fileID))
        throw new CloudContainerError('CloudBase 上传未返回有效 fileID');
    return result.fileID;
}
async function getTempFileUrls(fileIds) {
    const unique = [...new Set(fileIds.filter(isCloudFileId))];
    const urls = new Map();
    if (!unique.length)
        return urls;
    if (!wx.cloud || typeof wx.cloud.getTempFileURL !== 'function')
        throw new CloudContainerError('当前运行环境不支持 CloudBase 临时链接');
    const result = await wx.cloud.getTempFileURL({ fileList: unique });
    for (const item of (result === null || result === void 0 ? void 0 : result.fileList) || []) {
        if (item.status === 0 && item.tempFileURL)
            urls.set(item.fileID, item.tempFileURL);
    }
    return urls;
}
async function resolveUser(user, urls) {
    const avatarFileId = isCloudFileId(user.avatar) ? user.avatar : user.avatarFileId;
    if (!avatarFileId)
        return user;
    const resolved = urls || await getTempFileUrls([avatarFileId]);
    return { ...user, avatarFileId, avatar: resolved.get(avatarFileId) || '' };
}
async function resolveHomeImages(home) {
    const ids = []
        .concat([home.session, ...home.group.members, ...home.activities.map((item) => item.user)]
        .reduce((all, user) => all.concat([user.avatar, user.avatarFileId || '']), []))
        .concat(home.activities.map((item) => item.proofPath || ''))
        .filter(isCloudFileId);
    const urls = await getTempFileUrls(ids);
    const session = await resolveUser(home.session, urls);
    const members = await Promise.all(home.group.members.map((user) => resolveUser(user, urls)));
    const activityUsers = new Map(members.map((user) => [user.id, user]));
    const activities = await Promise.all(home.activities.map(async (activity) => ({
        ...activity,
        user: activityUsers.get(activity.user.id) || await resolveUser(activity.user, urls),
        proofPath: isCloudFileId(activity.proofPath) ? urls.get(activity.proofPath) || '' : activity.proofPath
    })));
    return { ...home, session, group: { ...home.group, members }, activities };
}
async function loadSession() {
    const raw = await request('/api/v1/session');
    const user = await resolveUser(raw.user);
    sessionCache = { ...raw, user };
    return sessionCache;
}
function createCloudApi() {
    return {
        getSession: loadSession,
        async getHomeData(groupId) {
            const home = await request(withQuery('/api/v1/home', { groupId }));
            return resolveHomeImages(home);
        },
        async updateProfile(input) {
            const avatar = input.avatar ? await uploadCurrentUserFile(input.avatar, 'avatars') : undefined;
            const user = await request('/api/v1/profile', { method: 'PATCH', data: { ...input, avatar } });
            const resolved = await resolveUser(user);
            if (sessionCache)
                sessionCache = { ...sessionCache, user: resolved, profileCompleted: true };
            return resolved;
        },
        async createCheckIn(input) {
            const proofPath = await uploadCurrentUserFile(input.proofPath, 'proofs');
            const result = await request('/api/v1/check-ins', { method: 'POST', data: { ...input, proofPath } });
            const urls = await getTempFileUrls([result.checkIn.proofPath]);
            return { ...result, checkIn: { ...result.checkIn, proofPath: urls.get(result.checkIn.proofPath) || '' } };
        },
        async getRankings(input) {
            const ranking = await request(withQuery('/api/v1/rankings', { groupId: input.groupId, type: input.type }));
            const urls = await getTempFileUrls(ranking.entries.map((entry) => entry.user.avatar));
            return { ...ranking, entries: await Promise.all(ranking.entries.map(async (entry) => ({ ...entry, user: await resolveUser(entry.user, urls) }))) };
        },
        getMessages: () => request('/api/v1/messages'),
        markAllMessagesRead: () => request('/api/v1/messages/read', { method: 'PATCH', data: {} }),
        sendNudge: (input) => request('/api/v1/nudges', { method: 'POST', data: input })
    };
}
