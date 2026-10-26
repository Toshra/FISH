import { Link } from 'react-router'
import { Brand } from '../components/Brand'

export function DashboardPreview() {
  return (
    <div className="app-preview-shell">
      <aside className="app-sidebar"><Brand /><nav aria-label="Application preview"><a className="active" href="#classes">▦ <span>My classes</span></a><a href="#preview-note">✦ <span>Activity history</span></a><a href="#preview-note">⚙ <span>Settings</span></a></nav><div className="sidebar-user"><span>TA</span><p><b>Teacher account</b><small>Not signed in</small></p></div></aside>
      <main id="main-content" className="dashboard-main">
        <div className="preview-banner" id="preview-note"><b>Fictional application preview</b><span>This is a preview with sample data. To access live classroom aquariums, student rosters, houses, and challenges, open your teacher space.</span><Link to="/app">Go to live app →</Link></div>
        <header className="dashboard-header"><div><span className="eyebrow">Teacher dashboard</span><h1>Your class aquariums</h1><p>Each class keeps its own roster, fish, activities, and shared goals.</p></div><Link className="button" to="/app">+ Create class</Link></header>
        <section className="dashboard-stats" aria-label="Fictional dashboard summary"><div><span>Classes</span><strong>2</strong></div><div><span>Learners</span><strong>56</strong></div><div><span>Active challenges</span><strong>2</strong></div></section>
        <section id="classes" className="class-grid" aria-label="Fictional class examples">
          <ClassCard name="Mabini 9" subject="Science · Grade 9" learners="24" challenge="Question Quest" progress="70%" color="teal" />
          <ClassCard name="Rizal 10" subject="Biology · Grade 10" learners="32" challenge="Everyone Contributes" progress="45%" color="blue" />
        </section>
      </main>
    </div>
  )
}

function ClassCard({ name, subject, learners, challenge, progress, color }: { name: string; subject: string; learners: string; challenge: string; progress: string; color: string }) {
  return <article className="class-card"><div className={`class-aquarium ${color}`}><span className="class-fish one">◀</span><span className="class-fish two">◀</span><span className="class-fish three">◀</span><i /><em>Fictional data</em></div><div className="class-content"><div><h2>{name}</h2><p>{subject} · {learners} learners</p></div><div className="class-challenge"><span>✦</span><p><small>Active challenge</small><b>{challenge}</b></p><strong>{progress}</strong></div><Link className="button button-outline" to="/app">Open class <span aria-hidden="true">→</span></Link></div></article>
}
