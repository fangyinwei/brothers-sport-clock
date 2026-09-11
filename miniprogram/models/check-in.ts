export type SportType = 'gym' | 'run' | 'basketball' | 'pilates';

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

export interface ScoreBreakdown {
  base: number;
  duration: number;
  calories: number;
  streak: number;
  total: number;
}

export interface CheckIn extends CheckInInput {
  id: string;
  userId: string;
  createdAt: string;
  calories: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: 'valid' | 'questioned' | 'voided';
}

export interface CheckInResult {
  checkIn: CheckIn;
  rank: number;
  rankDelta: number;
}
