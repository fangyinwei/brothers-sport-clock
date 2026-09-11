import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCalories, calculateCheckInScore, getShanghaiWeekRange, getStreakBonus } from '../src/domain';

test('calorie and score rules stay compatible with the original mock rules', () => {
  const calories = calculateCalories({ sport: 'gym', duration: 48, weight: 72 });
  assert.equal(calories, 363);
  assert.deepEqual(calculateCheckInScore({ duration: 48 }, calories), {
    base: 30,
    duration: 40,
    calories: 7,
    streak: 0,
    total: 77
  });
  assert.equal(getStreakBonus(2), 0);
  assert.equal(getStreakBonus(3), 10);
  assert.equal(getStreakBonus(7), 20);
});

test('week range is Monday through Sunday in Asia/Shanghai', () => {
  const range = getShanghaiWeekRange(new Date('2026-09-13T15:59:59.000Z'));
  assert.equal(range.start.toISOString(), '2026-09-06T16:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-09-13T16:00:00.000Z');
});
