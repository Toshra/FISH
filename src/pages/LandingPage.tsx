import { Link } from 'react-router'
import { AquariumPreview } from '../components/AquariumPreview'

const steps = [
  { number: '01', title: 'Create a class aquarium', text: 'Each class gets its own private space, with one unique fish for every enrolled learner.' },
  { number: '02', title: 'Notice meaningful effort', text: 'Teachers recognize participation, thoughtful questions, explanations, improvement, and helping others.' },
  { number: '03', title: 'Watch the whole class grow', text: 'Fish grow individually, group houses take shape through teamwork, and shared goals unlock decorations.' },
]

export function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Built for teacher-led classrooms</span>
          <h1>Grow participation.<br /><em>Build teamwork.</em><br />Celebrate every contribution.</h1>
          <p className="hero-lead">Turn everyday classroom effort into an aquarium your learners can grow together—one fish, one team, and one shared milestone at a time.</p>
          <div className="hero-actions">
            <Link className="button" to="/register">Create your teacher account <span aria-hidden="true">→</span></Link>
            <a className="text-link" href="#preview">Explore the preview <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-notes" aria-label="Product principles">
            <span>✓ No student accounts</span><span>✓ Teacher controlled</span><span>✓ Private by design</span>
          </div>
        </div>
        <div className="hero-visual" id="preview"><AquariumPreview /></div>
      </section>

      <section className="principle-band" aria-label="Core product principles">
        <p><span aria-hidden="true">◉</span> Individual effort</p><i aria-hidden="true" />
        <p><span aria-hidden="true">⌂</span> Teamwork</p><i aria-hidden="true" />
        <p><span aria-hidden="true">✦</span> Shared success</p>
      </section>

      <section className="section how-section" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">Simple by design</span>
          <h2>Recognition learners can see</h2>
          <p>Keep your teaching at the center. Grow &amp; Build makes progress visible without turning the classroom into a competition.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => <article className="step-card" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-heading left">
          <span className="eyebrow">Three ways to thrive</span>
          <h2>Every kind of progress has a place</h2>
        </div>
        <div className="feature-row fish-feature">
          <div className="feature-art growth-art" aria-label="Illustration showing a fictional fish growing across three stages">
            <span className="art-label">Individual growth</span>
            <div className="growth-stage stage-one"><FishIcon /><small>Baby</small></div>
            <div className="growth-line"><i /><i /><i /></div>
            <div className="growth-stage stage-two"><FishIcon /><small>Growing</small></div>
            <div className="growth-stage stage-three"><FishIcon /><small>Adult</small></div>
          </div>
          <div className="feature-copy"><span className="feature-number">01</span><h3>Every learner gets their own fish</h3><p>Participation points help each fish grow through visible stages. Progress belongs to the learner and stays intact when groups change or activities end.</p><ul><li>Recognize effort, reasoning, and improvement</li><li>Searchable roster for reliable awarding</li><li>No penalties for absence or inactivity</li></ul></div>
        </div>
        <div className="feature-row reverse">
          <div className="feature-art house-art" aria-label="Illustration showing a fictional group house under construction">
            <span className="art-label">Teamwork in action</span>
            <div className="house"><div className="roof" /><div className="house-body"><span /><span /></div><div className="door" /></div>
            <div className="house-progress"><div><span>Teamwork points</span><b>32 / 50</b></div><i><span /></i><small>Next: doors &amp; windows</small></div>
          </div>
          <div className="feature-copy"><span className="feature-number">02</span><h3>Groups build something together</h3><p>Create groups manually or at random for a class activity. Teamwork points develop a shared house while every learner’s fish remains their own.</p><ul><li>Flexible teacher-led grouping</li><li>Visible building milestones</li><li>Ungroup without losing fish progress</li></ul></div>
        </div>
        <div className="feature-row">
          <div className="feature-art challenge-art" aria-label="Fictional class challenge progress preview">
            <span className="art-label">A shared class goal</span><span className="treasure" aria-hidden="true">✦</span>
            <h4>Everyone Contributes</h4><p>Help every learner share one idea this week.</p>
            <div className="challenge-count"><strong>18</strong><span>of 24<br />contributors</span></div>
            <div className="challenge-bar"><span /></div><small>Reward: Treasure chest decoration</small>
          </div>
          <div className="feature-copy"><span className="feature-number">03</span><h3>The class reaches shared goals</h3><p>Class challenges encourage everyone to contribute. When the class reaches its target, a new aquarium decoration celebrates the collective achievement.</p><ul><li>One clear shared target at a time</li><li>Rewards that enrich the class aquarium</li><li>Separate from individual and group points</li></ul></div>
        </div>
      </section>

      <section className="values-section">
        <div className="values-copy"><span className="eyebrow light">A calmer kind of motivation</span><h2>Built to encourage,<br />never to punish.</h2><p>Growth only moves forward. There is no illness, lost progress, or penalty for being absent. Teachers stay in control of what gets recognized.</p></div>
        <div className="values-list"><div><span>01</span><p><b>Private classroom records</b><small>Teacher access only in the planned authenticated application.</small></p></div><div><span>02</span><p><b>Progress without ranking</b><small>Celebrate contribution without a public leaderboard.</small></p></div><div><span>03</span><p><b>Made for real classrooms</b><small>Readable on projectors, laptops, and tablets.</small></p></div></div>
      </section>

      <section className="cta-section"><div className="cta-bubbles" aria-hidden="true" /><span className="eyebrow">Ready when you are</span><h2>Make every contribution visible.</h2><p>Start with one class. Help every learner find a way to participate.</p><div><Link className="button button-light" to="/register">Get started <span aria-hidden="true">→</span></Link><Link className="button button-outline" to="/sign-in">Teacher sign in</Link></div><small>Phase A preview · Account services are not connected yet</small></section>
    </>
  )
}

function FishIcon() {
  return <svg viewBox="0 0 100 65" aria-hidden="true"><path d="M18 32C31 8 68 8 80 32 68 56 31 56 18 32Z" /><path d="M20 32 2 15v34l18-17Z" /><circle cx="67" cy="26" r="3" /><path className="fin" d="M45 15 55 2l7 16M46 48l9 13 7-16" /></svg>
}
