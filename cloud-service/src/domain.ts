export type SportType = 'gym' | 'run' | 'basketball' | 'pilates';
export type FitnessExperience = 'beginner' | 'regular' | 'advanced';

const MET: Record<SportType, number> = {
  gym: 6,
  run: 9.8,
  basketball: 8,
  pilates: 3.5
};

export interface ScoreBreakdown {
  base: number;
  duration: number;
  calories: number;
  streak: number;
  total: number;
}

export function calculateCalories(input: {
  sport: SportType;
  duration: number;
  weight?: number | null;
}): number {
  const weight = input.weight && input.weight > 0 ? input.weight : 65;
  const value = (MET[input.sport] * 3.5 * weight * Math.max(0, input.duration)) / 200;
  return Math.max(0, Math.round(value));
}

export function calculateCheckInScore(input: { duration: number }, calories: number, streakBonus = 0): ScoreBreakdown {
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

export interface WeekRange {
  start: Date;
  end: Date;
}

// Shanghai does not observe daylight saving time. Treating the local wall clock
// as UTC+08:00 makes the Monday-Sunday boundary deterministic on every host.
export function getShanghaiWeekRange(now = new Date()): WeekRange {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = shifted.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  return {
    start: new Date(monday.getTime() - 8 * 60 * 60 * 1000),
    end: new Date(monday.getTime() + (7 * 24 - 8) * 60 * 60 * 1000)
  };
}

export function dateKeyShanghai(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toMysqlUtc(value: Date): string {
  return value.toISOString().slice(0, 23).replace('T', ' ');
}

export function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized).toISOString();
}

export function rankFor(values: number[], currentIndex: number): number {
  const current = values[currentIndex];
  return 1 + values.filter((value) => value > current).length;
}
