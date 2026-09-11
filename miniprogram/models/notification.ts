export type MessageType = 'nudge' | 'cheer' | 'challenge' | 'rank' | 'system';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  fromUserId?: string;
  fromNickname?: string;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
}

export interface SendNudgeInput {
  targetUserId: string;
  template: string;
}

export interface SubscribeConfig {
  enabled: boolean;
  templateId?: string;
}
