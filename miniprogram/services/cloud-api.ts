import { FitnessApi } from './api';
import { HomeData } from '../models/group';
import { CheckInInput, CheckInResult } from '../models/check-in';
import { Message, SendNudgeInput } from '../models/notification';
import { RankingData, RankingQuery } from '../models/ranking';
import { Session, UpdateProfileInput, User } from '../models/user';
import { CLOUD_CONFIG, isCloudConfigured } from '../config/cloud';

/**
 * 微信云托管适配器。业务页面仍只依赖 FitnessApi；此处负责统一走 callContainer。
 */
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

function assertCloudConfiguration(): void {
  if (!isCloudConfigured()) {
    throw new CloudContainerError('微信云托管尚未配置环境 ID 或服务名');
  }
  if (!wx.cloud || typeof wx.cloud.callContainer !== 'function') {
    throw new CloudContainerError('当前运行环境不支持微信云托管调用');
  }
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

  throw new CloudContainerError(`云服务请求失败：${statusCode || 'unknown'}`, statusCode || undefined);
}

export async function healthCheck(): Promise<CloudHealth> {
  const health = await request<CloudHealth>('/health');
  if (health.status !== 'ok' || !Number.isFinite(Date.parse(health.timestamp))) {
    throw new CloudContainerError('云服务健康检查返回格式无效');
  }
  return health;
}

function withQuery(path: string, query: Record<string, string>): string {
  const search = Object.keys(query)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');
  return `${path}?${search}`;
}

export function createCloudApi(): FitnessApi {
  return {
    getSession: () => request<Session>('/api/v1/session'),
    getHomeData: (groupId) => request<HomeData>(withQuery('/api/v1/home', { groupId })),
    updateProfile: (input) => request<User>('/api/v1/profile', { method: 'PATCH', data: input }),
    createCheckIn: (input) => request<CheckInResult>('/api/v1/check-ins', { method: 'POST', data: input }),
    getRankings: (input) => request<RankingData>(withQuery('/api/v1/rankings', { groupId: input.groupId, type: input.type })),
    getMessages: () => request<Message[]>('/api/v1/messages'),
    sendNudge: (input: SendNudgeInput) => request<void>('/api/v1/nudges', { method: 'POST', data: input })
  };
}
