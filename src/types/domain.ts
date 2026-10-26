import type { Timestamp } from 'firebase/firestore'

export type GrowthStageId = 'baby' | 'young' | 'growing' | 'adult' | 'evolved'

export interface GrowthThreshold { id: GrowthStageId; label: string; points: number }
export interface AwardReason { id: string; label: string; points: number; active: boolean }

export interface TeacherClass {
  id: string
  ownerId: string
  name: string
  subject: string
  grade: string
  archivedAt: Timestamp | null
  thresholds: GrowthThreshold[]
  reasons: AwardReason[]
  activeActivityId?: string | null
  activeChallengeId?: string | null
  aquariumDecorations?: Array<{ challengeId: string; reward: AquariumReward; selected: boolean }>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface HouseThreshold { id: string; label: string; points: number }
export interface GroupReason { id: string; label: string; points: number }
export interface ActivityGroup {
  id: string; ownerId: string; classId: string; activityId: string; name: string
  memberIds: string[]; initialMemberIds: string[]; finalMemberIds?: string[]; points: number; lastMutationId: string
  decorationSelections: string[]; createdAt: Timestamp; updatedAt: Timestamp
}
export interface GroupActivity {
  id: string; ownerId: string; classId: string; title: string; status: 'active' | 'completed'
  participantIds: string[]; excludedIds: string[]; groupIds: string[]
  houseThresholds: HouseThreshold[]; groupReasons: GroupReason[]
  startedAt: Timestamp; completedAt: Timestamp | null; completionRequestId: string | null
}
export interface GroupAwardRecord {
  id: string; ownerId: string; classId: string; activityId: string; groupId: string
  groupName: string; amount: number; reasonId: string; reasonLabel: string
  requestKey: string; reversedBy: string | null; createdAt: Timestamp
}
export interface MembershipEvent {
  id: string; ownerId: string; classId: string; activityId: string; studentId: string
  studentName: string; fromGroupId: string; fromGroupName: string; toGroupId: string; toGroupName: string
  requestKey: string; createdAt: Timestamp
}
export interface GroupingTemplate { id: string; ownerId: string; classId: string; name: string; groups: Array<{ name: string; memberIds: string[] }>; createdAt: Timestamp }

export type ChallengeMode = 'reason-count' | 'distinct-contributors' | 'manual'
export type AquariumReward = 'coral' | 'plants' | 'treasure' | 'background'
export interface ClassChallenge {
  id: string; ownerId: string; classId: string; title: string; target: number
  mode: ChallengeMode; reasonId: string | null; reasonLabel: string | null
  eligibleIds: string[]; contributorIds: string[]; contributorCounts?: Record<string, number>; currentProgress: number
  reward: AquariumReward; rewardActive: boolean; rewardSelected: boolean
  status: 'active' | 'ended'; startsAt: Timestamp; endsAt: Timestamp; endedAt: Timestamp | null
}
export interface ChallengeProgressEvent { id:string; ownerId:string; classId:string; challengeId:string; amount:number; note:string; reversedBy:string|null; createdAt:Timestamp }
export interface EligibilityEvent { id:string; ownerId:string; classId:string; challengeId:string; studentId:string; studentName:string; action:'add'|'remove'; createdAt:Timestamp }

export const DEFAULT_HOUSE_THRESHOLDS: HouseThreshold[] = [
  { id: 'empty', label: 'Empty lot', points: 0 }, { id: 'foundation', label: 'Foundation', points: 5 },
  { id: 'frame', label: 'Floor & frame', points: 10 }, { id: 'walls', label: 'Walls', points: 20 },
  { id: 'roof', label: 'Roof', points: 30 }, { id: 'openings', label: 'Doors & windows', points: 40 },
  { id: 'complete', label: 'Complete house', points: 50 },
]
export const DEFAULT_GROUP_REASONS: GroupReason[] = [
  { id: 'everyone-contributes', label: 'Everyone contributes', points: 3 },
  { id: 'clear-explanation', label: 'Clear explanation', points: 3 },
  { id: 'cooperation', label: 'Cooperation', points: 2 },
  { id: 'completion', label: 'Task completion', points: 2 },
  { id: 'improvement', label: 'Team improvement', points: 2 },
]

export interface Enrollment {
  id: string
  ownerId: string
  classId: string
  name: string
  displayName: string
  fishName: string
  fishStyle: number
  points: number
  status: 'active' | 'inactive'
  evolutionHistory?: Record<string, string>
  earnedGlows?: Record<string, boolean>
  lastMutationId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AwardRecord {
  id: string
  ownerId: string
  classId: string
  studentId: string
  recipientName: string
  amount: number
  reasonId: string
  reasonLabel: string
  operationId: string
  requestKey: string
  reversedBy: string | null
  createdAt: Timestamp
}

export interface ReversalRecord {
  id: string
  ownerId: string
  classId: string
  studentId: string
  awardId: string
  amount: number
  createdAt: Timestamp
}

export const DEFAULT_THRESHOLDS: GrowthThreshold[] = [
  { id: 'baby', label: 'Baby', points: 0 },
  { id: 'young', label: 'Young', points: 10 },
  { id: 'growing', label: 'Growing', points: 25 },
  { id: 'adult', label: 'Adult', points: 50 },
  { id: 'evolved', label: 'Evolved', points: 100 },
]

export const DEFAULT_REASONS: AwardReason[] = [
  { id: 'relevant-attempt', label: 'Relevant attempt', points: 1, active: true },
  { id: 'thoughtful-question', label: 'Thoughtful question', points: 2, active: true },
  { id: 'explanation', label: 'Clear explanation', points: 3, active: true },
  { id: 'helping', label: 'Helping a classmate', points: 2, active: true },
  { id: 'improvement', label: 'Improvement', points: 2, active: true },
]
