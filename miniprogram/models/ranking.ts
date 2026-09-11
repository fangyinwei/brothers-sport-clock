import { SportType } from './check-in';
import { User } from './user';

export type RankingType = 'score' | 'calories' | 'streak' | SportType;

export interface RankingQuery {
  groupId: string;
  type: RankingType;
}

export interface RankingEntry {
  rank: number;
  user: User;
  value: number;
  unit: string;
  trend: number;
  highlighted: boolean;
  detail: string;
}

export interface RankingData {
  type: RankingType;
  title: string;
  unit: string;
  entries: RankingEntry[];
  updatedAt: string;
}
