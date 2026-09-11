import { CheckInInput } from '../models/check-in';

const MET: Record<CheckInInput['sport'], number> = {
  gym: 6,
  run: 9.8,
  basketball: 8,
  pilates: 3.5
};

export interface CalorieInput {
  sport: CheckInInput['sport'];
  duration: number;
  weight?: number;
  distance?: number;
}

export function calculateCalories(input: CalorieInput): number {
  const weight = input.weight && input.weight > 0 ? input.weight : 65;
  const value = (MET[input.sport] * 3.5 * weight * Math.max(0, input.duration)) / 200;
  return Math.max(0, Math.round(value));
}
