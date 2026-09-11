export type FitnessExperience = 'beginner' | 'regular' | 'advanced';

export interface UserStats {
  weeklyScore: number;
  weeklyCalories: number;
  weeklyMinutes: number;
  streakDays: number;
  rank: number;
  checkInDays: number;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  height: number;
  weight: number;
  experience: FitnessExperience;
  stats: UserStats;
  /** Cloud API uses this transient client-only value to keep the source fileID after resolving a temp URL. */
  avatarFileId?: string;
}

export interface Session {
  authenticated: boolean;
  user: User;
  groupId: string;
  profileCompleted: boolean;
  uploadPrefix?: string;
}

export interface UpdateProfileInput {
  nickname: string;
  avatar?: string;
  height: number;
  weight: number;
  experience: FitnessExperience;
}
