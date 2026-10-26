import{type FormEvent,useEffect,useState}from'react'
import{Link,useNavigate,useParams}from'react-router'
import{useAuth}from'../auth/AuthContext'
import{Modal}from'../components/Modal'
import{getErrorMessage}from'../lib/errors'
import{addManualProgress,changeEligibility,endChallenge,reverseManualProgress,setRewardSelected,startChallenge,watchChallenges,watchEligibilityEvents,watchManualProgress}from'../services/challengeService'
import{watchClasses}from'../services/classService'
import{watchStudents}from'../services/studentService'
import type{AquariumReward,ChallengeMode,ChallengeProgressEvent,ClassChallenge,EligibilityEvent,Enrollment,TeacherClass}from'../types/domain'

export function ChallengesPage(){const{classId=''}=useParams();const{user}=useAuth();const navigate=useNavigate();const[cls,setCls]=useState<TeacherClass>();const[students,setStudents]=useState<Enrollment[]>([]);const[challenges,setChallenges]=useState<ClassChallenge[]>([]);const[creating,setCreating]=useState(false);const[error,setError]=useState('');useEffect(()=>user?watchClasses(user.uid,items=>{const found=items.find(c=>c.id===classId);if(!found)navigate('/app');else setCls(found)},e=>setError(getErrorMessage(e))):undefined,[user,classId,navigate]);useEffect(()=>user?watchStudents(user.uid,classId,setStudents,e=>setError(getErrorMessage(e))):undefined,[user,classId]);useEffect(()=>user?watchChallenges(user.uid,classId,setChallenges,e=>setError(getErrorMessage(e))):undefined,[user,classId]);const active=challenges.find(c=>c.status==='active');if(!cls)return <div className="state"><div className="loader"/><p>Loading class challenges…</p></div>;return <><header className="workspace-header"><div><Link to={`/app/classes/${classId}`}>← {cls.name} aquarium</Link><span className="eyebrow">Shared class goals</span><h1>Class challenges</h1><p>Shared progress unlocks aquarium decorations without changing fish or group points.</p></div>{!active&&!cls.archivedAt&&<button className="button" onClick={()=>setCreating(true)}>+ New challenge</button>}</header><DisplayLinks classId={classId}/>{error&&<div className="state error-state" role="alert"><b>Something needs attention.</b><p>{error}</p><button onClick={()=>setError('')}>Dismiss</button></div>}{active?<ActiveChallenge challenge={active} students={students} uid={user!.uid} classId={classId} setError={setError}/>:<div className="state empty-state"><span>✦</span><h2>No active challenge</h2><p>Create a time-bound shared goal with a frozen eligibility list and an aquarium reward.</p>{!cls.archivedAt&&<button className="button" onClick={()=>setCreating(true)}>Create challenge</button>}</div>}<section className="challenge-history"><h2>Challenge history & rewards</h2>{challenges.filter(c=>c.status==='ended').map(c=><ChallengeSummary key={c.id} challenge={c} uid={user!.uid} classId={classId} setError={setError}/>)}{!challenges.some(c=>c.status==='ended')&&<p>No completed challenges yet.</p>}</section>{creating&&<ChallengeBuilder cls={cls} students={students} uid={user!.uid} classId={classId} onClose={()=>setCreating(false)} setError={setError}/>}</>}

function DisplayLinks({classId}:{classId:string}){return <nav className="display-links" aria-label="Classroom displays"><span>Classroom display:</span><Link to={`/app/classes/${classId}/display/aquarium`}>Aquarium</Link><Link to={`/app/classes/${classId}/display/village`}>Group village</Link><Link to={`/app/classes/${classId}/display/challenge`}>Challenge</Link></nav>}
const localIsoString = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

function ChallengeBuilder({cls,students,uid,classId,onClose,setError}:{cls:TeacherClass;students:Enrollment[];uid:string;classId:string;onClose:()=>void;setError:(s:string)=>void}){
  const[mode,setMode]=useState<ChallengeMode>('reason-count')
  const[eligible,setEligible]=useState(new Set(students.filter(s=>s.status==='active').map(s=>s.id)))
  const[saving,setSaving]=useState(false)
  const [defaultStartsAt] = useState(() => localIsoString(new Date()))
  const [defaultEndsAt] = useState(() => localIsoString(new Date(Date.now() + 7 * 86400000)))

  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    setSaving(true)
    const d=new FormData(e.currentTarget)
    const reason=cls.reasons.find(r=>r.id===d.get('reason'))
    try{
      await startChallenge(uid,classId,{
        title:String(d.get('title')),
        target:Number(d.get('target')),
        mode,
        reasonId:reason?.id??null,
        reasonLabel:reason?.label??null,
        eligibleIds:[...eligible],
        reward:String(d.get('reward'))as AquariumReward,
        startsAt:new Date(String(d.get('startsAt'))),
        endsAt:new Date(String(d.get('endsAt')))
      },crypto.randomUUID())
      onClose()
    }catch(x){
      setError(getErrorMessage(x))
    }finally{
      setSaving(false)
    }
  }

  return (
    <Modal title="Create class challenge" onClose={onClose}>
      <form className="stack-form" onSubmit={submit}>
        <label>Challenge title<input name="title" required maxLength={100} placeholder="e.g. Everyone Contributes"/></label>
        <label>Tracking mode
          <select value={mode} onChange={e=>setMode(e.target.value as ChallengeMode)}>
            <option value="reason-count">Count matching awards</option>
            <option value="distinct-contributors">Distinct student contributors</option>
            <option value="manual">Teacher-entered progress</option>
          </select>
        </label>
        {mode!=='manual'&&<label>Qualifying award reason<select name="reason">{cls.reasons.filter(r=>r.active).map(r=><option value={r.id} key={r.id}>{r.label}</option>)}</select></label>}
        <label>Target<input name="target" type="number" min="1" max="999" required defaultValue={mode==='distinct-contributors'?eligible.size:20}/></label>
        <div className="date-grid">
          <label>Starts<input name="startsAt" type="datetime-local" defaultValue={defaultStartsAt} required/></label>
          <label>Ends<input name="endsAt" type="datetime-local" defaultValue={defaultEndsAt} required/></label>
        </div>
        <label>Aquarium reward
          <select name="reward">
            <option value="coral">Coral</option>
            <option value="plants">Aquatic plants</option>
            <option value="treasure">Treasure chest</option>
            <option value="background">Special background</option>
          </select>
        </label>
        <fieldset>
          <legend>Eligible learners · {eligible.size}</legend>
          <div className="participant-list">
            {students.map(s=>(
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={eligible.has(s.id)}
                  onChange={e=>setEligible(old=>{
                    const next=new Set(old)
                    if (e.target.checked) next.add(s.id)
                    else next.delete(s.id)
                    return next
                  })}
                />
                <span>{s.displayName||s.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="preview-note">Eligibility and rules are snapshotted when the challenge starts. Later changes are explicitly logged.</p>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="button" disabled={saving}>{saving?'Starting…':'Start challenge'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ActiveChallenge({challenge,students,uid,classId,setError}:{challenge:ClassChallenge;students:Enrollment[];uid:string;classId:string;setError:(s:string)=>void}){const[entries,setEntries]=useState<ChallengeProgressEvent[]>([]);const[eligibility,setEligibility]=useState<EligibilityEvent[]>([]);const[saving,setSaving]=useState(false);useEffect(()=>watchManualProgress(uid,classId,challenge.id,setEntries,e=>setError(getErrorMessage(e))),[uid,classId,challenge.id,setError]);useEffect(()=>watchEligibilityEvents(uid,classId,challenge.id,setEligibility,e=>setError(getErrorMessage(e))),[uid,classId,challenge.id,setError]);const percent=Math.min(100,Math.round(challenge.currentProgress/challenge.target*100));const add=async()=>{const raw=prompt('How much progress should be added?','1');if(!raw)return;const note=prompt('Short note for the audit history:')||'';setSaving(true);try{await addManualProgress(uid,classId,challenge.id,Number(raw),note,crypto.randomUUID())}catch(e){setError(getErrorMessage(e))}finally{setSaving(false)}};return <section className="challenge-card-main"><div className="challenge-status"><span className="live-dot">● Active challenge</span><h2>{challenge.title}</h2><p>{challenge.mode==='manual'?'Teacher-confirmed progress':challenge.mode==='distinct-contributors'?'Distinct eligible contributors':`Awards for “${challenge.reasonLabel}”`}</p><div className="big-progress"><span style={{width:`${percent}%`}}/></div><strong>{challenge.currentProgress} / {challenge.target}</strong><small>{challenge.startsAt.toDate().toLocaleString('en-PH')} – {challenge.endsAt.toDate().toLocaleString('en-PH')}</small></div><div className={`reward-panel ${challenge.rewardActive?'earned':'locked'}`}><span>{rewardIcon(challenge.reward)}</span><b>{challenge.rewardActive?'Reward unlocked':'Reward locked'}</b><p>{challenge.reward}</p><button disabled={!challenge.rewardActive||saving} onClick={()=>setRewardSelected(uid,classId,challenge.id,!challenge.rewardSelected).catch(e=>setError(getErrorMessage(e)))}>{challenge.rewardSelected?'Remove from aquarium':'Apply to aquarium'}</button>{challenge.rewardSelected&&!challenge.rewardActive&&<small>Selection preserved but inactive until re-earned.</small>}</div><div className="challenge-actions">{challenge.mode==='manual'&&<button className="button" disabled={saving} onClick={add}>Add progress</button>}<button onClick={()=>{if(confirm('End this challenge? Its history and reward selection will be preserved.'))endChallenge(uid,classId,challenge.id,`end_${challenge.id}`).catch(e=>setError(getErrorMessage(e)))}}>End challenge</button></div><details><summary>Eligibility · {challenge.eligibleIds.length} learners</summary><div className="eligibility-grid">{students.map(s=>{const included=challenge.eligibleIds.includes(s.id);return <button key={s.id} className={included?'included':''} onClick={()=>changeEligibility(uid,classId,challenge.id,s.id,s.displayName||s.name,included?'remove':'add',crypto.randomUUID()).catch(e=>setError(getErrorMessage(e)))}>{included?'✓':'+'} {s.displayName||s.name}</button>})}</div></details>{challenge.mode==='manual'&&<details><summary>Manual progress history ({entries.length})</summary>{entries.map(e=><div className="audit-row" key={e.id}><span>+{e.amount} {e.note}</span><button disabled={Boolean(e.reversedBy)} onClick={()=>reverseManualProgress(uid,classId,challenge.id,e.id).catch(x=>setError(getErrorMessage(x)))}>{e.reversedBy?'Corrected':'Undo'}</button></div>)}</details>}<details><summary>Eligibility changes ({eligibility.length})</summary>{eligibility.map(e=><div className="audit-row" key={e.id}>{e.studentName} · {e.action}</div>)}</details></section>}
function ChallengeSummary({challenge,uid,classId,setError}:{challenge:ClassChallenge;uid:string;classId:string;setError:(s:string)=>void}){return <article className="challenge-summary"><span>{rewardIcon(challenge.reward)}</span><div><b>{challenge.title}</b><small>{challenge.currentProgress} / {challenge.target} · {challenge.rewardActive?'Reward earned':'Goal not currently met'}</small></div><button disabled={!challenge.rewardActive} onClick={()=>setRewardSelected(uid,classId,challenge.id,!challenge.rewardSelected).catch(e=>setError(getErrorMessage(e)))}>{challenge.rewardSelected?'Applied':'Apply reward'}</button></article>}
function rewardIcon(reward:AquariumReward){return reward==='coral'?'♨':reward==='plants'?'♣':reward==='treasure'?'▣':'◒'}
