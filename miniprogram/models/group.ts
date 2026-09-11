import { User } from './user';
import { SportType } from './check-in';

export interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  endsAt: string;
  reward: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  members: User[];
  weeklyGoal: number;
  challenge: GroupChallenge;
}

export interface CalendarDay {
  key: string;
  label: string;
  date: number;
  completed: boolean;
  isToday: boolean;
}

export interface Activity {
  id: string;
  user: User;
  sport: SportType;
  title: string;
  detail: string;
  score: number;
  createdAt: string;
  proofPath?: string;
}

export interface HomeData {
  session: User;
  group: Group;
  calendar: CalendarDay[];
  activities: Activity[];
  stats: User['stats'];
}
