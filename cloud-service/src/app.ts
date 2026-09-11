import express, { NextFunction, Request, Response } from 'express';
import { HttpError, unauthenticated } from './errors';
import { BrofitService } from './service';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

export interface AppDependencies {
  service?: BrofitService;
  ping?: () => Promise<void>;
}

function openid(request: Request): string {
  const value = request.header('x-wx-openid')?.trim();
  if (!value) throw unauthenticated();
  return value;
}

function requireService(service: BrofitService | undefined): BrofitService {
  if (!service) throw new HttpError(503, 'SERVICE_NOT_READY', '云服务尚未完成初始化');
  return service;
}

function asBody(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new HttpError(400, 'INVALID_ARGUMENT', '请求体格式无效');
  }
  return request.body as Record<string, unknown>;
}

function errorPayload(error: unknown): { status: number; body: { error: { code: string; message: string } } } {
  if (error instanceof HttpError) return { status: error.status, body: { error: { code: error.code, message: error.message } } };
  console.error(JSON.stringify({ event: 'request_failed', error: error instanceof Error ? error.name : 'unknown' }));
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } } };
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_request, response) => {
    const timestamp = new Date().toISOString();
    if (!dependencies.ping) return response.status(200).json({ status: 'ok', timestamp } satisfies HealthResponse);
    try {
      await dependencies.ping();
      return response.status(200).json({ status: 'ok', timestamp } satisfies HealthResponse);
    } catch (_error) {
      return response.status(503).json({ status: 'error', timestamp } satisfies HealthResponse);
    }
  });

  const authenticated = (handler: (request: Request, response: Response) => Promise<unknown>) =>
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        await handler(request, response);
      } catch (error) {
        next(error);
      }
    };

  app.get('/api/v1/session', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).getSession(id);
    response.status(200).json(payload);
  }));

  app.get('/api/v1/subscribe/config', authenticated(async (request, response) => {
    openid(request);
    response.status(200).json(requireService(dependencies.service).getSubscribeConfig());
  }));

  app.get('/api/v1/home', authenticated(async (request, response) => {
    const id = openid(request);
    const groupId = String(request.query.groupId || '');
    const payload = await requireService(dependencies.service).getHome(id, groupId);
    response.status(200).json(payload);
  }));

  app.patch('/api/v1/profile', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).updateProfile(id, asBody(request) as any);
    response.status(200).json(payload);
  }));

  app.post('/api/v1/check-ins', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).createCheckIn(id, asBody(request) as any);
    response.status(201).json(payload);
  }));

  app.post('/api/v1/check-ins/:checkInId/likes', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).toggleCheckInLike(id, String(request.params.checkInId));
    response.status(200).json(payload);
  }));

  app.get('/api/v1/rankings', authenticated(async (request, response) => {
    const id = openid(request);
    const groupId = String(request.query.groupId || '');
    const type = String(request.query.type || '');
    const payload = await requireService(dependencies.service).getRankings(id, groupId, type);
    response.status(200).json(payload);
  }));

  app.get('/api/v1/messages', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).getMessages(id);
    response.status(200).json(payload);
  }));

  app.patch('/api/v1/messages/read', authenticated(async (request, response) => {
    const id = openid(request);
    const payload = await requireService(dependencies.service).markAllMessagesRead(id);
    response.status(200).json(payload);
  }));

  app.post('/api/v1/nudges', authenticated(async (request, response) => {
    const id = openid(request);
    const body = asBody(request);
    await requireService(dependencies.service).sendNudge(id, body.targetUserId as string, body.template as string);
    response.status(204).send();
  }));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const payload = errorPayload(error);
    response.status(payload.status).json(payload.body);
  });

  return app;
}

export default createApp();
