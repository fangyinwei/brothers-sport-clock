import { WechatSubscribeConfig } from './config';

export interface SubscribeNotifier {
  send(openid: string, values: { sender: string; message: string; date: string }): Promise<void>;
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
}

interface SendResponse {
  errcode?: number;
}

function render(template: string, values: Record<string, string>): string {
  return template.replace(/\{(sender|message|date)\}/g, (_match, key: string) => values[key] || '');
}

export class WechatSubscribeNotifier implements SubscribeNotifier {
  private token: { value: string; expiresAt: number } | undefined;

  constructor(private readonly config: WechatSubscribeConfig) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', this.config.appId);
    url.searchParams.set('secret', this.config.appSecret);
    const response = await fetch(url);
    const body = await response.json() as AccessTokenResponse;
    if (!response.ok || !body.access_token) throw new Error(`wechat_token_failed:${body.errcode || response.status}`);
    this.token = { value: body.access_token, expiresAt: Date.now() + Math.max(60, Number(body.expires_in || 7200) - 60) * 1000 };
    return this.token.value;
  }

  async send(openid: string, values: { sender: string; message: string; date: string }): Promise<void> {
    const accessToken = await this.accessToken();
    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(accessToken)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        touser: openid,
        template_id: this.config.templateId,
        page: this.config.page,
        data: Object.fromEntries(Object.entries(this.config.data).map(([key, value]) => [key, { value: render(value, values) }]))
      })
    });
    const body = await response.json() as SendResponse;
    if (!response.ok || body.errcode !== 0) throw new Error(`wechat_subscribe_send_failed:${body.errcode || response.status}`);
  }
}
