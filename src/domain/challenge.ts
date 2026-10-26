import type { ChallengeMode } from '../types/domain'

export interface ChallengeProjection { progress:number; contributorIds:string[]; rewardActive:boolean }
export function projectChallenge(mode:ChallengeMode,target:number,current:number,contributors:string[],eligibleIds:string[],input:{studentId?:string;amount?:number;qualifies:boolean;reverse?:boolean}):ChallengeProjection{
  if(!Number.isInteger(target)||target<1)throw new Error('Challenge target must be a positive whole number.')
  if(!input.qualifies)return{progress:current,contributorIds:[...contributors],rewardActive:current>=target}
  let next: number
  let nextContributors = [...contributors]
  if (mode === 'distinct-contributors') {
    if (!input.studentId || !eligibleIds.includes(input.studentId)) return { progress: current, contributorIds: nextContributors, rewardActive: current >= target }
    if (input.reverse) { nextContributors = nextContributors.filter(id => id !== input.studentId) } else if (!nextContributors.includes(input.studentId)) nextContributors.push(input.studentId)
    next = nextContributors.length
  } else {
    const amount = input.amount ?? 1
    if (!Number.isInteger(amount) || amount < 1) throw new Error('Progress must be a positive whole number.')
    next = Math.max(0, current + (input.reverse ? -amount : amount))
  }
  return { progress: next, contributorIds: nextContributors, rewardActive: next >= target }
}

export function isChallengeInPeriod(now:number,startsAt:number,endsAt:number){return now>=startsAt&&now<=endsAt}
