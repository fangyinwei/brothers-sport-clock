export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function invalid(message: string): HttpError {
  return new HttpError(400, 'INVALID_ARGUMENT', message);
}

export function notFound(message = '资源不存在'): HttpError {
  return new HttpError(404, 'NOT_FOUND', message);
}

export function unauthenticated(): HttpError {
  return new HttpError(401, 'UNAUTHENTICATED', '缺少微信身份上下文');
}

export function forbidden(message = '无权访问该资源'): HttpError {
  return new HttpError(403, 'FORBIDDEN', message);
}
