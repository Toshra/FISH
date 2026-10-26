export interface DraftGroup { id: string; name: string; memberIds: string[] }
export type RandomSource = () => number

export function shuffle<T>(values: T[], random: RandomSource = Math.random): T[] {
  const result=[...values]
  for(let index=result.length-1;index>0;index--){const target=Math.floor(random()*(index+1));[result[index],result[target]]=[result[target],result[index]]}
  return result
}

export function capacitiesByGroupCount(participants: number, groupCount: number): number[] {
  if(!Number.isInteger(participants)||participants<1)throw new Error('Select at least one participant.')
  if(!Number.isInteger(groupCount)||groupCount<1||groupCount>participants)throw new Error('Group count must be between 1 and the number of participants.')
  const base=Math.floor(participants/groupCount),remainder=participants%groupCount
  return Array.from({length:groupCount},(_,index)=>base+(index<remainder?1:0))
}

export function capacitiesByTargetSize(participants:number,targetSize:number,remainder:'smaller'|'balanced'):number[]{
  if(!Number.isInteger(participants)||participants<1)throw new Error('Select at least one participant.')
  if(!Number.isInteger(targetSize)||targetSize<1)throw new Error('Target size must be a positive whole number.')
  if(targetSize>=participants)return[participants]
  const full=Math.floor(participants/targetSize),extra=participants%targetSize
  if(extra===0)return Array(full).fill(targetSize)
  if(remainder==='smaller')return[...Array(full).fill(targetSize),extra]
  return capacitiesByGroupCount(participants,full)
}

export function validateParticipants(selected:string[]):void{
  if(!selected.length)throw new Error('Select at least one participant.')
  if(new Set(selected).size!==selected.length)throw new Error('A participant appears more than once.')
}

export function buildGrouping(participantIds:string[],capacities:number[],locks:Record<string,string>,existing:DraftGroup[]=[],random:RandomSource=Math.random):DraftGroup[]{
  validateParticipants(participantIds)
  if(capacities.some(size=>!Number.isInteger(size)||size<1)||capacities.reduce((a,b)=>a+b,0)!==participantIds.length)throw new Error('Group capacities must place every participant exactly once.')
  const groups=capacities.map((_,index)=>({id:existing[index]?.id||`group-${index+1}`,name:existing[index]?.name||`Group ${index+1}`,memberIds:[] as string[]}))
  const selected=new Set(participantIds)
  for(const[studentId,groupId]of Object.entries(locks)){if(!selected.has(studentId))throw new Error('A locked student is not participating.');const index=groups.findIndex(group=>group.id===groupId);if(index<0)throw new Error('A lock points to a group that does not exist.');if(groups[index].memberIds.length>=capacities[index])throw new Error(`${groups[index].name} has more locked students than its capacity.`);groups[index].memberIds.push(studentId)}
  const unlocked=shuffle(participantIds.filter(id=>!locks[id]),random)
  groups.forEach((group,index)=>{while(group.memberIds.length<capacities[index]){const next=unlocked.shift();if(!next)throw new Error('The selected capacities are infeasible.');group.memberIds.push(next)}})
  validateGrouping(participantIds,groups);return groups
}

export function buildManualGrouping(participantIds:string[],groupCount:number,existing:DraftGroup[]=[]):DraftGroup[]{
  validateParticipants(participantIds)
  if(!Number.isInteger(groupCount)||groupCount<1||groupCount>participantIds.length)throw new Error('Group count must be between 1 and the number of participants.')
  return Array.from({length:groupCount},(_,index)=>({id:existing[index]?.id||`group-${index+1}`,name:existing[index]?.name||`Group ${index+1}`,memberIds:index===0?[...participantIds]:[]}))
}

export function validateGrouping(participantIds:string[],groups:DraftGroup[]):void{
  const placed=groups.flatMap(group=>group.memberIds);validateParticipants(participantIds)
  if(placed.length!==participantIds.length||new Set(placed).size!==placed.length||placed.some(id=>!participantIds.includes(id)))throw new Error('Every selected participant must appear exactly once.')
}

export function applyTemplate(groups:DraftGroup[],availableIds:string[]):{groups:DraftGroup[];missingIds:string[];unassignedIds:string[]}{
  const available=new Set(availableIds),used=new Set<string>(),missing:string[]=[]
  const copied=groups.map(group=>({...group,id:crypto.randomUUID(),memberIds:group.memberIds.filter(id=>{if(!available.has(id)){missing.push(id);return false}used.add(id);return true})}))
  return{groups:copied,missingIds:missing,unassignedIds:availableIds.filter(id=>!used.has(id))}
}
