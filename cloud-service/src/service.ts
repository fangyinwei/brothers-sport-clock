import { randomUUID } from 'node:crypto';
import { affectedRows, SqlConnection, SqlExecutor, SqlPool } from './db/pool';
import { forbidden, invalid, notFound } from './errors';
import {
  calculateCalories,
  calculateCheckInScore,
  dateKeyShanghai,
  FitnessExperience,
  getShanghaiWeekRange,
  getStreakBonus,
  rankFor,
  SportType,
  toIso,
  toMysqlUtc
} from './domain';
import {
  ApiCheckIn,
  ApiUser,
  CheckInInput,
  GroupResponse,
  HomeResponse,
  MessageResponse,
  ProfileInput,
  RankingResponse,
  SessionResponse,
  UserStats
} from './types';

const GROUP_ID = 'group-brofit';
const GROUP_NAME = '兄弟运动局';
const DEFAULT_AVATAR = '';

interface UserRow {
  id: string;
  nickname: string | null;
  avatar_file_id: string | null;
  height_cm: number | string | null;
  weight_kg: number | string | null;
  experience: FitnessExperience | null;
}

interface MemberRow extends UserRow {
  joined_at?: string | Date;
}

interface CheckInRow {
  id: string;
  user_id: string;
  group_id: string;
  sport: SportType;
  duration_minutes: number;
  distance_km: number | string | null;
  training_type: string | null;
  body_part: string | null;
  note: string | null;
  proof_file_id: string;
  calories: number;
  score_base: number;
  score_duration: number;
  score_calories: number;
  score_streak: number;
  score_total: number;
  status: 'valid' | 'questioned' | 'voided';
  created_at: string | Date;
  nickname?: string | null;
  avatar_file_id?: string | null;
  height_cm?: number | string | null;
  weight_kg?: number | string | null;
  experience?: FitnessExperience | null;
}

interface WeeklyStats {
  byUser: Map<string, UserStats>;
  rows: CheckInRow[];
}

interface GroupRow {
  id: string;
  name: string;
  weekly_goal_calories: number;
}

function numberValue(value: number | string | null | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function relativeTime(value: Date | string, now: Date): string {
  const diff = Math.max(0, now.getTime() - new Date(toIso(value)).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

function userProfileCompleted(row: UserRow): boolean {
  return Boolean(row.nickname?.trim() && row.height_cm && row.weight_kg && row.experience);
}

function apiUser(row: UserRow, stats: UserStats): ApiUser {
  return {
    id: row.id,
    nickname: row.nickname?.trim() || 'BroFit兄弟',
    avatar: row.avatar_file_id || DEFAULT_AVATAR,
    height: numberValue(row.height_cm, 170),
    weight: numberValue(row.weight_kg, 65),
    experience: row.experience || 'regular',
    stats
  };
}

function emptyStats(): UserStats {
  return { weeklyScore: 0, weeklyCalories: 0, weeklyMinutes: 0, streakDays: 0, rank: 0, checkInDays: 0 };
}

function assertOwnedFileId(fileId: string | undefined, userId: string, required: boolean): string | undefined {
  if (!fileId && !required) return undefined;
  if (!fileId || !fileId.startsWith('cloud://')) throw invalid('凭证必须是 CloudBase fileID');
  const expected = `/users/${userId}/`;
  if (!fileId.includes(expected)) throw forbidden('不能使用其他用户目录下的文件');
  return fileId;
}

function assertString(value: unknown, field: string, maxLength: number, required = false): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) throw invalid(`${field}不能为空`);
    return undefined;
  }
  if (typeof value !== 'string' || value.trim().length > maxLength) throw invalid(`${field}格式无效`);
  return value.trim();
}

function validateSport(value: unknown): SportType {
  if (value !== 'gym' && value !== 'run' && value !== 'basketball' && value !== 'pilates') throw invalid('sport格式无效');
  return value;
}

function validateProfile(input: ProfileInput): ProfileInput {
  const nickname = assertString(input?.nickname, 'nickname', 12, true)!;
  const height = Number(input?.height);
  const weight = Number(input?.weight);
  if (!Number.isFinite(height) || height < 50 || height > 250) throw invalid('height格式无效');
  if (!Number.isFinite(weight) || weight < 20 || weight > 300) throw invalid('weight格式无效');
  if (input?.experience !== 'beginner' && input?.experience !== 'regular' && input?.experience !== 'advanced') {
    throw invalid('experience格式无效');
  }
  if (input?.avatar && !input.avatar.startsWith('cloud://')) throw invalid('avatar必须是CloudBase fileID');
  return { nickname, avatar: input.avatar, height, weight, experience: input.experience };
}

function checkInFromRow(row: CheckInRow): ApiCheckIn {
  return {
    id: row.id,
    userId: row.user_id,
    sport: row.sport,
    duration: numberValue(row.duration_minutes),
    distance: row.distance_km === null ? undefined : numberValue(row.distance_km),
    trainingType: row.training_type || undefined,
    bodyPart: row.body_part || undefined,
    note: row.note || undefined,
    proofPath: row.proof_file_id,
    createdAt: toIso(row.created_at),
    calories: numberValue(row.calories),
    score: numberValue(row.score_total),
    scoreBreakdown: {
      base: numberValue(row.score_base),
      duration: numberValue(row.score_duration),
      calories: numberValue(row.score_calories),
      streak: numberValue(row.score_streak),
      total: numberValue(row.score_total)
    },
    status: row.status
  };
}

function statsFromRows(memberIds: string[], rows: CheckInRow[]): Map<string, UserStats> {
  const accumulator = new Map<string, { score: number; calories: number; minutes: number; dates: Set<string> }>();
  memberIds.forEach((id) => accumulator.set(id, { score: 0, calories: 0, minutes: 0, dates: new Set<string>() }));
  rows.filter((row) => row.status === 'valid').forEach((row) => {
    const value = accumulator.get(row.user_id);
    if (!value) return;
    value.score += numberValue(row.score_total);
    value.calories += numberValue(row.calories);
    value.minutes += numberValue(row.duration_minutes);
    value.dates.add(dateKeyShanghai(row.created_at));
  });
  const stats = new Map<string, UserStats>();
  accumulator.forEach((value, userId) => {
    const streakDays = value.dates.size;
    stats.set(userId, {
      weeklyScore: value.score + getStreakBonus(streakDays),
      weeklyCalories: value.calories,
      weeklyMinutes: value.minutes,
      streakDays,
      rank: 0,
      checkInDays: streakDays
    });
  });
  const ordered = [...stats.entries()].sort((a, b) => b[1].weeklyScore - a[1].weeklyScore);
  ordered.forEach(([userId, value], index) => {
    value.rank = index + 1;
    stats.set(userId, value);
  });
  return stats;
}

function profileRowFromMember(row: MemberRow): UserRow {
  return row;
}

export class BrofitService {
  constructor(private readonly pool: SqlPool, private readonly now: () => Date = () => new Date()) {}

  private async currentUser(openid: string, executor: SqlExecutor = this.pool): Promise<UserRow> {
    const [rows] = await executor.query<UserRow[]>('SELECT id, nickname, avatar_file_id, height_cm, weight_kg, experience FROM users WHERE openid = ? LIMIT 1', [openid]);
    const user = rows[0];
    if (!user) throw notFound('用户不存在');
    return user;
  }

  private async ensureUser(openid: string): Promise<UserRow> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const candidateId = randomUUID();
      const [result] = await connection.query('INSERT IGNORE INTO users (id, openid) VALUES (?, ?)', [candidateId, openid]);
      const created = affectedRows(result) > 0;
      const user = await this.currentUser(openid, connection);
      await connection.query('INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', [GROUP_ID, user.id]);
      if (created) {
        await connection.query(
          `INSERT INTO messages (id, recipient_user_id, type, title, content, action_label)
           VALUES (?, ?, 'system', '欢迎加入兄弟运动局', '从今天开始，每一次运动都算数。完善资料后就可以开始打卡啦！', '完善资料')`,
          [randomUUID(), user.id]
        );
      }
      await connection.commit();
      return user;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async group(executor: SqlExecutor = this.pool): Promise<GroupRow> {
    const [rows] = await executor.query<GroupRow[]>('SELECT id, name, weekly_goal_calories FROM `groups` WHERE id = ? LIMIT 1', [GROUP_ID]);
    if (!rows[0]) throw new Error('group-brofit is missing; run database migrations');
    return rows[0];
  }

  private async members(executor: SqlExecutor = this.pool): Promise<MemberRow[]> {
    const [rows] = await executor.query<MemberRow[]>(
      `SELECT u.id, u.nickname, u.avatar_file_id, u.height_cm, u.weight_kg, u.experience, gm.joined_at
       FROM group_members gm JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ? ORDER BY gm.joined_at ASC, u.id ASC`,
      [GROUP_ID]
    );
    return rows;
  }

  private async weeklyStats(executor: SqlExecutor = this.pool): Promise<WeeklyStats> {
    const { start, end } = getShanghaiWeekRange(this.now());
    const [rows] = await executor.query<CheckInRow[]>(
      `SELECT id, user_id, group_id, sport, duration_minutes, distance_km, training_type, body_part, note,
              proof_file_id, calories, score_base, score_duration, score_calories, score_streak, score_total,
              status, created_at
       FROM check_ins
       WHERE group_id = ? AND status = 'valid' AND created_at >= ? AND created_at < ?
       ORDER BY created_at DESC`,
      [GROUP_ID, toMysqlUtc(start), toMysqlUtc(end)]
    );
    const memberRows = await this.members(executor);
    return { byUser: statsFromRows(memberRows.map((row) => row.id), rows), rows };
  }

  private async userResponse(row: UserRow, stats?: UserStats): Promise<ApiUser> {
    return apiUser(row, stats || emptyStats());
  }

  async getSession(openid: string): Promise<SessionResponse> {
    const user = await this.ensureUser(openid);
    const weekly = await this.weeklyStats();
    const stats = weekly.byUser.get(user.id) || emptyStats();
    return {
      authenticated: true,
      user: await this.userResponse(user, stats),
      groupId: GROUP_ID,
      profileCompleted: userProfileCompleted(user),
      uploadPrefix: `users/${user.id}`
    };
  }

  async updateProfile(openid: string, input: ProfileInput): Promise<ApiUser> {
    const user = await this.currentUser(openid);
    const valid = validateProfile(input);
    const avatar = valid.avatar ? assertOwnedFileId(valid.avatar, user.id, true) : undefined;
    await this.pool.query(
      `UPDATE users SET nickname = ?, avatar_file_id = COALESCE(?, avatar_file_id), height_cm = ?, weight_kg = ?, experience = ? WHERE id = ?`,
      [valid.nickname, avatar || null, valid.height, valid.weight, valid.experience, user.id]
    );
    const updated = await this.currentUser(openid);
    const weekly = await this.weeklyStats();
    return this.userResponse(updated, weekly.byUser.get(user.id));
  }

  private validateCheckIn(input: CheckInInput, userId: string): Required<Pick<CheckInInput, 'sport' | 'duration' | 'proofPath'>> & CheckInInput {
    const sport = validateSport(input?.sport);
    const duration = Number(input?.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > 300) throw invalid('duration格式无效');
    const proofPath = assertOwnedFileId(input?.proofPath, userId, true)!;
    const rawDistance: unknown = input?.distance;
    const distance = rawDistance === undefined || rawDistance === null || rawDistance === '' ? undefined : Number(rawDistance);
    if (distance !== undefined && (!Number.isFinite(distance) || distance < 0 || distance > 1000)) throw invalid('distance格式无效');
    return {
      ...input,
      sport,
      duration,
      distance,
      proofPath,
      trainingType: assertString(input?.trainingType, 'trainingType', 64),
      bodyPart: assertString(input?.bodyPart, 'bodyPart', 64),
      note: assertString(input?.note, 'note', 500)
    };
  }

  async createCheckIn(openid: string, input: CheckInInput): Promise<{ checkIn: ApiCheckIn; rank: number; rankDelta: number }> {
    const user = await this.currentUser(openid);
    const valid = this.validateCheckIn(input, user.id);
    const before = await this.weeklyStats();
    const beforeStats = before.byUser.get(user.id) || emptyStats();
    const calories = calculateCalories({ sport: valid.sport, duration: valid.duration, weight: numberValue(user.weight_kg, 65) });
    const score = calculateCheckInScore(valid, calories);
    const createdAt = this.now();
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO check_ins
       (id, group_id, user_id, sport, duration_minutes, distance_km, training_type, body_part, note, proof_file_id,
        calories, score_base, score_duration, score_calories, score_streak, score_total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)`,
      [id, GROUP_ID, user.id, valid.sport, valid.duration, valid.distance ?? null, valid.trainingType || null, valid.bodyPart || null,
        valid.note || null, valid.proofPath, calories, score.base, score.duration, score.calories, score.streak, score.total, toMysqlUtc(createdAt)]
    );
    const after = await this.weeklyStats();
    const afterStats = after.byUser.get(user.id) || emptyStats();
    const ranksBefore = [...before.byUser.values()].map((item) => item.weeklyScore).sort((a, b) => b - a);
    const rankBefore = beforeStats.rank || rankFor(ranksBefore, ranksBefore.indexOf(beforeStats.weeklyScore));
    const checkIn: ApiCheckIn = {
      id,
      userId: user.id,
      sport: valid.sport,
      duration: valid.duration,
      distance: valid.distance,
      trainingType: valid.trainingType,
      bodyPart: valid.bodyPart,
      note: valid.note,
      proofPath: valid.proofPath,
      createdAt: createdAt.toISOString(),
      calories,
      score: score.total,
      scoreBreakdown: score,
      status: 'valid'
    };
    return { checkIn, rank: afterStats.rank, rankDelta: rankBefore - afterStats.rank };
  }

  private async homeDataFor(user: UserRow): Promise<HomeResponse> {
    const group = await this.group();
    const memberRows = await this.members();
    const weekly = await this.weeklyStats();
    const statsFor = (member: UserRow) => weekly.byUser.get(member.id) || emptyStats();
    const members = memberRows.map((member) => apiUser(member, statsFor(member)));
    const [activityRows] = await this.pool.query<CheckInRow[]>(
      `SELECT c.id, c.user_id, c.group_id, c.sport, c.duration_minutes, c.distance_km, c.training_type, c.body_part,
              c.note, c.proof_file_id, c.calories, c.score_base, c.score_duration, c.score_calories, c.score_streak,
              c.score_total, c.status, c.created_at, u.nickname, u.avatar_file_id, u.height_cm, u.weight_kg, u.experience
       FROM check_ins c JOIN users u ON u.id = c.user_id
       WHERE c.group_id = ? AND c.status = 'valid'
       ORDER BY c.created_at DESC LIMIT 5`,
      [GROUP_ID]
    );
    const { rows: calendarRows } = weekly;
    const ownDates = new Set(calendarRows.filter((row) => row.user_id === user.id).map((row) => dateKeyShanghai(row.created_at)));
    const shifted = new Date(this.now().getTime() + 8 * 60 * 60 * 1000);
    const monday = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
    const day = monday.getUTCDay();
    monday.setUTCDate(monday.getUTCDate() + (day === 0 ? -6 : 1 - day));
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const calendar = labels.map((label, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      return { key, label, date: date.getUTCDate(), completed: ownDates.has(key), isToday: dateKeyShanghai(this.now()) === key };
    });
    const activities = activityRows.map((row) => {
      const activityUser = apiUser({
        id: row.user_id,
        nickname: row.nickname || 'BroFit兄弟',
        avatar_file_id: row.avatar_file_id || null,
        height_cm: row.height_cm || null,
        weight_kg: row.weight_kg || null,
        experience: row.experience || 'regular'
      }, statsFor({ id: row.user_id, nickname: row.nickname || null, avatar_file_id: row.avatar_file_id || null, height_cm: row.height_cm || null, weight_kg: row.weight_kg || null, experience: row.experience || 'regular' }));
      const sportName = row.sport === 'gym' ? '健身' : row.sport === 'run' ? '跑步' : row.sport === 'pilates' ? '普拉提' : '篮球';
      return {
        id: row.id,
        user: activityUser,
        sport: row.sport,
        title: `${activityUser.nickname} 完成了${sportName}打卡`,
        detail: `${row.duration_minutes < 60 ? `${row.duration_minutes}分钟` : `${Math.floor(row.duration_minutes / 60)}小时${row.duration_minutes % 60 ? `${row.duration_minutes % 60}分钟` : ''}`} · ${row.calories} 千卡`,
        score: row.score_total,
        createdAt: relativeTime(row.created_at, this.now()),
        proofPath: row.proof_file_id
      };
    });
    const currentCalories = weekly.rows.reduce((sum, row) => sum + numberValue(row.calories), 0);
    const groupResponse: GroupResponse = {
      id: group.id,
      name: group.name,
      inviteCode: 'BROFIT5',
      memberIds: members.map((member) => member.id),
      members,
      weeklyGoal: numberValue(group.weekly_goal_calories),
      challenge: {
        id: 'challenge-001',
        title: '本周全组燃脂挑战',
        description: '全组累计消耗 5000 千卡，完成后解锁“燃动小队”称号。',
        target: numberValue(group.weekly_goal_calories),
        current: currentCalories,
        unit: '千卡',
        endsAt: '本周日 23:59',
        reward: '燃动小队称号'
      }
    };
    return { session: apiUser(user, statsFor(user)), group: groupResponse, calendar, activities, stats: statsFor(user) };
  }

  async getHome(openid: string, requestedGroupId: string): Promise<HomeResponse> {
    if (requestedGroupId !== GROUP_ID) throw notFound('小组不存在');
    const user = await this.currentUser(openid);
    const memberRows = await this.members();
    if (!memberRows.some((member) => member.id === user.id)) throw forbidden('用户不在该小组');
    return this.homeDataFor(user);
  }

  async getRankings(openid: string, groupId: string, type: string): Promise<RankingResponse> {
    if (groupId !== GROUP_ID) throw notFound('小组不存在');
    const allowed = new Set(['score', 'calories', 'streak', 'gym', 'run', 'basketball', 'pilates']);
    if (!allowed.has(type)) throw invalid('排行榜类型无效');
    const user = await this.currentUser(openid);
    const memberRows = await this.members();
    if (!memberRows.some((member) => member.id === user.id)) throw forbidden('用户不在该小组');
    const weekly = await this.weeklyStats();
    const values = memberRows.map((member) => {
      const own = weekly.rows.filter((row) => row.user_id === member.id && row.status === 'valid');
      const stats = weekly.byUser.get(member.id) || emptyStats();
      let value = 0;
      let detail = '';
      if (type === 'score') { value = stats.weeklyScore; detail = `${stats.checkInDays} 天有效打卡`; }
      if (type === 'calories') { value = stats.weeklyCalories; detail = `${stats.weeklyMinutes} 分钟运动`; }
      if (type === 'streak') { value = stats.streakDays; detail = `${stats.weeklyScore} 积分`; }
      if (type === 'gym') { value = own.filter((row) => row.sport === 'gym').reduce((sum, row) => sum + numberValue(row.duration_minutes), 0); detail = '力量与体能训练'; }
      if (type === 'run') { value = Number(own.filter((row) => row.sport === 'run').reduce((sum, row) => sum + numberValue(row.distance_km), 0).toFixed(1)); detail = '累计跑步距离'; }
      if (type === 'basketball') { value = own.filter((row) => row.sport === 'basketball').reduce((sum, row) => sum + numberValue(row.duration_minutes), 0); detail = '球场活跃时长'; }
      if (type === 'pilates') { value = own.filter((row) => row.sport === 'pilates').reduce((sum, row) => sum + numberValue(row.duration_minutes), 0); detail = '核心与柔韧训练'; }
      return { member, stats, value, detail };
    }).sort((a, b) => b.value - a.value || String(a.member.id).localeCompare(String(b.member.id)));
    return {
      type,
      title: ({ score: '综合积分榜', calories: '卡路里消耗榜', streak: '坚持天数榜', gym: '健身时长榜', run: '跑步距离榜', basketball: '篮球时长榜', pilates: '普拉提时长榜' } as Record<string, string>)[type],
      unit: ({ score: '分', calories: '千卡', streak: '天', gym: '分钟', run: '公里', basketball: '分钟', pilates: '分钟' } as Record<string, string>)[type],
      updatedAt: '刚刚更新',
      entries: values.map((item, index) => ({
        rank: index + 1,
        user: apiUser(item.member, item.stats),
        value: item.value,
        unit: ({ score: '分', calories: '千卡', streak: '天', gym: '分钟', run: '公里', basketball: '分钟', pilates: '分钟' } as Record<string, string>)[type],
        trend: 0,
        highlighted: item.member.id === user.id,
        detail: item.detail
      }))
    };
  }

  async getMessages(openid: string): Promise<MessageResponse[]> {
    const user = await this.currentUser(openid);
    const [rows] = await this.pool.query<Array<{ id: string; type: string; title: string; content: string; sender_user_id: string | null; sender_nickname: string | null; created_at: string | Date; read_at: string | Date | null; action_label: string | null }>>(
      `SELECT m.id, m.type, m.title, m.content, m.sender_user_id, s.nickname AS sender_nickname, m.created_at, m.read_at, m.action_label
       FROM messages m LEFT JOIN users s ON s.id = m.sender_user_id
       WHERE m.recipient_user_id = ? ORDER BY m.created_at DESC`,
      [user.id]
    );
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      fromUserId: row.sender_user_id || undefined,
      fromNickname: row.sender_nickname || undefined,
      createdAt: toIso(row.created_at),
      read: Boolean(row.read_at),
      actionLabel: row.action_label || undefined
    }));
  }

  async markAllMessagesRead(openid: string): Promise<{ updated: number }> {
    const user = await this.currentUser(openid);
    const [result] = await this.pool.query('UPDATE messages SET read_at = CURRENT_TIMESTAMP(3) WHERE recipient_user_id = ? AND read_at IS NULL', [user.id]);
    return { updated: affectedRows(result) };
  }

  async sendNudge(openid: string, targetUserId: string, template: string): Promise<void> {
    const sender = await this.currentUser(openid);
    const content = assertString(template, 'template', 200, true)!;
    if (!targetUserId || typeof targetUserId !== 'string') throw invalid('targetUserId格式无效');
    const [rows] = await this.pool.query<Array<{ id: string; nickname: string | null }>>(
      `SELECT u.id, u.nickname FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? AND u.id = ? LIMIT 1`,
      [GROUP_ID, targetUserId]
    );
    const target = rows[0];
    if (!target) throw forbidden('只能提醒兄弟运动局成员');
    if (target.id === sender.id) throw invalid('不能提醒自己');
    await this.pool.query(
      `INSERT INTO messages (id, recipient_user_id, sender_user_id, type, title, content, action_label) VALUES (?, ?, ?, 'nudge', ?, ?, '去打卡')`,
      [randomUUID(), target.id, sender.id, `${sender.nickname || '兄弟'} 提醒你`, content]
    );
  }
}
