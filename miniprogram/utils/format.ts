export function pad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

export function dateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}小时${rest}分钟` : `${hours}小时`;
}

export function formatCalories(value: number): string {
  return `${Math.round(value)} 千卡`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export function getWeekDays(date: Date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const labels = ['一', '二', '三', '四', '五', '六', '日'];
  return labels.map((label, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + mondayOffset + index);
    return {
      key: dateKey(current),
      label,
      date: current.getDate(),
      isToday: dateKey(current) === dateKey(today)
    };
  });
}
