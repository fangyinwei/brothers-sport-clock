import type { FitnessApi } from './api';
import { HomeData } from '../models/group';
import { CheckInInput, CheckInResult } from '../models/check-in';
import { Message, SendNudgeInput } from '../models/notification';
import { RankingData, RankingQuery } from '../models/ranking';
import { Session, UpdateProfileInput, User } from '../models/user';
import { CLOUD_CONFIG, isCloudConfigured } from '../config/cloud';

export interface CloudHealth {
  status: 'ok';
  timestamp: string;
}

interface CloudRequestOptions {
  method?: string;
  data?: unknown;
  header?: Record<string, string>;
}

export class CloudContainerError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'CloudContainerError';
  }
}

let sessionCache: Session | null = null;

function assertCloudConfiguration(): void {
  if (!isCloudConfigured()) throw new CloudContainerError('微信云托管尚未配置环境 ID 或服务名');
  if (!wx.cloud || typeof wx.cloud.callContainer !== 'function') throw new CloudContainerError('当前运行环境不支持微信云托管调用');
}

async function request<T>(path: string, options: CloudRequestOptions = {}): Promise<T> {
  assertCloudConfiguration();
  const response = await wx.cloud.callContainer({
    config: { env: CLOUD_CONFIG.envId },
    path,
    method: options.method || 'GET',
    data: options.data,
    timeout: CLOUD_CONFIG.timeout,
    header: {
      'content-type': 'application/json',
      'X-WX-SERVICE': CLOUD_CONFIG.serviceName,
      ...(options.header || {})
    }
  });
  const statusCode = Number(response && response.statusCode);
  if (statusCode >= 200 && statusCode < 300) return response.data as T;
  const message = response?.data?.error?.message || `云服务请求失败：${statusCode || 'unknown'}`;
  throw new CloudContainerError(message, statusCode || undefined);
}

export async function healthCheck(): Promise<CloudHealth> {
  const health = await request<CloudHealth>('/health');
  if (health.status !== 'ok' || !Number.isFinite(Date.parse(health.timestamp))) throw new CloudContainerError('云服务健康检查返回格式无效');
  return health;
}

function withQuery(path: string, query: Record<string, string>): string {
  const search = Object.keys(query)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');
  return `${path}?${search}`;
}

function isCloudFileId(value: string | undefined): value is string {
  return Boolean(value && value.startsWith('cloud://'));
}

function extensionOf(path: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(path);
  return match?.[1]?.toLowerCase() || 'jpg';
}

async function uploadCurrentUserFile(localPath: string, kind: 'avatars' | 'proofs'): Promise<string> {
  if (isCloudFileId(localPath)) return localPath;
  if (!wx.cloud || typeof wx.cloud.uploadFile !== 'function') throw new CloudContainerError('当前运行环境不支持 CloudBase 文件上传');
  const session = sessionCache || await loadSession();
  if (!session.uploadPrefix) throw new CloudContainerError('云服务未返回当前用户上传目录');
  const cloudPath = `${session.uploadPrefix}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionOf(localPath)}`;
  const result = await wx.cloud.uploadFile({ cloudPath, filePath: localPath });
  if (!result?.fileID || !isCloudFileId(result.fileID)) throw new CloudContainerError('CloudBase 上传未返回有效 fileID');
  return result.fileID;
}

async function getTempFileUrls(fileIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(fileIds.filter(isCloudFileId))];
  const urls = new Map<string, string>();
  if (!unique.length) return urls;
  if (!wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') throw new CloudContainerError('当前运行环境不支持 CloudBase 临时链接');
  const result = await wx.cloud.getTempFileURL({ fileList: unique });
  for (const item of result?.fileList || []) {
    if (item.status === 0 && item.tempFileURL) urls.set(item.fileID, item.tempFileURL);
  }
  return urls;
}

async function resolveUser(user: User, urls?: Map<string, string>): Promise<User> {
  const avatarFileId = isCloudFileId(user.avatar) ? user.avatar : user.avatarFileId;
  if (!avatarFileId) return user;
  const resolved = urls || await getTempFileUrls([avatarFileId]);
  return { ...user, avatarFileId, avatar: resolved.get(avatarFileId) || '' };
}

async function resolveHomeImages(home: HomeData): Promise<HomeData> {
  const ids = ([] as string[])
    .concat(
      [home.session, ...home.group.members, ...home.activities.map((item) => item.user)]
        .reduce((all: string[], user: User) => all.concat([user.avatar, user.avatarFileId || '']), [])
    )
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

async function loadSession(): Promise<Session> {
  const raw = await request<Session>('/api/v1/session');
  const user = await resolveUser(raw.user);
  sessionCache = { ...raw, user };
  return sessionCache;
}

export function createCloudApi(): FitnessApi {
  return {
    getSession: loadSession,
    async getHomeData(groupId: string): Promise<HomeData> {
      const home = await request<HomeData>(withQuery('/api/v1/home', { groupId }));
      return resolveHomeImages(home);
    },
    async updateProfile(input: UpdateProfileInput): Promise<User> {
      const avatar = input.avatar ? await uploadCurrentUserFile(input.avatar, 'avatars') : undefined;
      const user = await request<User>('/api/v1/profile', { method: 'PATCH', data: { ...input, avatar } });
      const resolved = await resolveUser(user);
      if (sessionCache) sessionCache = { ...sessionCache, user: resolved, profileCompleted: true };
      return resolved;
    },
    async createCheckIn(input: CheckInInput): Promise<CheckInResult> {
      const proofPath = await uploadCurrentUserFile(input.proofPath, 'proofs');
      const result = await request<CheckInResult>('/api/v1/check-ins', { method: 'POST', data: { ...input, proofPath } });
      const urls = await getTempFileUrls([result.checkIn.proofPath]);
      return { ...result, checkIn: { ...result.checkIn, proofPath: urls.get(result.checkIn.proofPath) || '' } };
    },
    async getRankings(input: RankingQuery): Promise<RankingData> {
      const ranking = await request<RankingData>(withQuery('/api/v1/rankings', { groupId: input.groupId, type: input.type }));
      const urls = await getTempFileUrls(ranking.entries.map((entry) => entry.user.avatar));
      return { ...ranking, entries: await Promise.all(ranking.entries.map(async (entry) => ({ ...entry, user: await resolveUser(entry.user, urls) }))) };
    },
    getMessages: () => request<Message[]>('/api/v1/messages'),
    markAllMessagesRead: () => request<{ updated: number }>('/api/v1/messages/read', { method: 'PATCH', data: {} }),
    sendNudge: (input: SendNudgeInput) => request<void>('/api/v1/nudges', { method: 'POST', data: input })
  };
}
