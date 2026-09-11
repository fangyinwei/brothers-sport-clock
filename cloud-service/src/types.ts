import { FitnessExperience, ScoreBreakdown, SportType } from './domain';

export interface UserStats {
  weeklyScore: number;
  weeklyCalories: number;
  weeklyMinutes: number;
  streakDays: number;
  rank: number;
  checkInDays: number;
}

export interface ApiUser {
  id: string;
  nickname: string;
  avatar: string;
  height: number;
  weight: number;
  experience: FitnessExperience;
  stats: UserStats;
}

export interface SessionResponse {
  authenticated: true;
  user: ApiUser;
  groupId: string;
  profileCompleted: boolean;
  uploadPrefix: string;
}

export interface SubscribeConfigResponse {
  enabled: boolean;
  templateId?: string;
}

export interface ProfileInput {
  nickname: string;
  avatar?: string;
  height: number;
  weight: number;
  experience: FitnessExperience;
}

export interface CheckInInput {
  sport: SportType;
  duration: number;
  distance?: number;
  trainingType?: string;
  bodyPart?: string;
  note?: string;
  proofPath: string;
  createdAt?: string;
}

export interface ApiCheckIn extends CheckInInput {
  id: string;
  userId: string;
  createdAt: string;
  calories: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: 'valid' | 'questioned' | 'voided';
}

export interface CheckInLikeResult {
  liked: boolean;
  likes: number;
}

export interface GroupResponse {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  members: ApiUser[];
  weeklyGoal: number;
  challenge: {
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    unit: string;
    endsAt: string;
    reward: string;
  };
}

export interface HomeResponse {
  session: ApiUser;
  group: GroupResponse;
  calendar: Array<{ key: string; label: string; date: number; completed: boolean; isToday: boolean }>;
  activities: Array<{
    id: string;
    user: ApiUser;
    sport: SportType;
    title: string;
    detail: string;
    score: number;
    createdAt: string;
    proofPath?: string;
    likes: number;
    liked: boolean;
  }>;
  stats: UserStats;
}

export interface RankingResponse {
  type: string;
  title: string;
  unit: string;
  updatedAt: string;
  entries: Array<{ rank: number; user: ApiUser; value: number; unit: string; trend: number; highlighted: boolean; detail: string }>;
}

export interface MessageResponse {
  id: string;
  type: string;
  title: string;
  content: string;
  fromUserId?: string;
  fromNickname?: string;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
}
