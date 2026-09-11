import { CheckInInput, ScoreBreakdown } from '../models/check-in';

export function calculateCheckInScore(input: CheckInInput, calories: number, streakBonus = 0): ScoreBreakdown {
  const base = 30;
  const duration = Math.min(40, Math.max(0, Math.round(input.duration)));
  const caloriePoints = Math.min(20, Math.floor(Math.max(0, calories) / 50));
  const total = Math.min(90, base + duration + caloriePoints) + streakBonus;
  return { base, duration, calories: caloriePoints, streak: streakBonus, total };
}

export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 7) return 20;
  if (streakDays >= 3) return 10;
  return 0;
}
