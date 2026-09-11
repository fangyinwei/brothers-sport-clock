import { HomeData } from '../models/group';
import { CheckInInput, CheckInResult } from '../models/check-in';
import { Message, SendNudgeInput } from '../models/notification';
import { RankingData, RankingQuery } from '../models/ranking';
import { Session, UpdateProfileInput, User } from '../models/user';
import { createMockApi } from './mock-api';

export interface FitnessApi {
  getSession(): Promise<Session>;
  getHomeData(groupId: string): Promise<HomeData>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  createCheckIn(input: CheckInInput): Promise<CheckInResult>;
  getRankings(input: RankingQuery): Promise<RankingData>;
  getMessages(): Promise<Message[]>;
  sendNudge(input: SendNudgeInput): Promise<void>;
}

let api: FitnessApi | null = null;

export function getApi(): FitnessApi {
  if (!api) api = createMockApi();
  return api;
}
