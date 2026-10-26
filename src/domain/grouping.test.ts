import { describe, expect, it } from 'vitest'
import { applyTemplate, buildGrouping, buildManualGrouping, capacitiesByGroupCount, capacitiesByTargetSize, validateGrouping } from './grouping'

const ids=(count:number)=>Array.from({length:count},(_,i)=>`s${i+1}`)
const zero=()=>0
describe('group allocation',()=>{
  it('balances group-count mode evenly',()=>expect(capacitiesByGroupCount(32,5)).toEqual([7,7,6,6,6]))
  it('supports both target-size remainder choices',()=>{expect(capacitiesByTargetSize(32,5,'smaller')).toEqual([5,5,5,5,5,5,2]);expect(capacitiesByTargetSize(32,5,'balanced')).toEqual([6,6,5,5,5,5])})
  it('handles even, uneven, and single participant inputs',()=>{expect(capacitiesByGroupCount(12,3)).toEqual([4,4,4]);expect(capacitiesByGroupCount(1,1)).toEqual([1])})
  it('rejects empty and impossible group counts',()=>{expect(()=>capacitiesByGroupCount(0,1)).toThrow();expect(()=>capacitiesByGroupCount(3,4)).toThrow()})
  it('places every participant exactly once',()=>{const participants=ids(11),groups=buildGrouping(participants,[4,4,3],{},[],zero);expect(groups.flatMap(g=>g.memberIds).sort()).toEqual(participants.sort());expect(()=>validateGrouping(participants,[...groups,{id:'x',name:'X',memberIds:['s1']}])).toThrow()})
  it('preserves locks while reshuffling',()=>{const groups=buildGrouping(ids(6),[3,3],{s1:'a',s6:'b'},[{id:'a',name:'A',memberIds:[]},{id:'b',name:'B',memberIds:[]}],zero);expect(groups[0].memberIds).toContain('s1');expect(groups[1].memberIds).toContain('s6')})
  it('explains infeasible lock capacities',()=>expect(()=>buildGrouping(ids(3),[1,2],{s1:'a',s2:'a'},[{id:'a',name:'A',memberIds:[]},{id:'b',name:'B',memberIds:[]}],zero)).toThrow(/capacity/))
  it('copies templates without unavailable members and flags roster changes',()=>{const result=applyTemplate([{id:'a',name:'A',memberIds:['s1','gone']}],['s1','new']);expect(result.groups[0].memberIds).toEqual(['s1']);expect(result.missingIds).toEqual(['gone']);expect(result.unassignedIds).toEqual(['new'])})
  it('creates a manual board without randomizing students',()=>{const groups=buildManualGrouping(ids(4),3);expect(groups.map(g=>g.memberIds)).toEqual([['s1','s2','s3','s4'],[],[]]);validateGrouping(ids(4),groups)})
})
