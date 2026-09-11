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
}

export interface Session {
  authenticated: boolean;
  user: User;
  groupId: string;
  profileCompleted: boolean;
}

export interface UpdateProfileInput {
  nickname: string;
  avatar?: string;
  height: number;
  weight: number;
  experience: FitnessExperience;
}
