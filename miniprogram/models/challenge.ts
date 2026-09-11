export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  endsAt: string;
  reward: string;
}
