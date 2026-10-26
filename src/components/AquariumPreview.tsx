import { FishIllustration } from './FishIllustration'
import { FISH_INVENTORY } from '../domain/fishEvolution'

const previewFish = [
  { name: 'Sam', points: 4, fish: FISH_INVENTORY[0], hasGlow: false, x: 14, y: 32, delay: '0s' },
  { name: 'Mika', points: 15, fish: FISH_INVENTORY[1], hasGlow: true, x: 55, y: 22, delay: '-2s' },
  { name: 'Paolo', points: 30, fish: FISH_INVENTORY[14], hasGlow: true, x: 34, y: 56, delay: '-4s' },
  { name: 'Aya', points: 65, fish: FISH_INVENTORY[21], hasGlow: true, x: 72, y: 50, delay: '-1s' },
]

export function AquariumPreview() {
  return (
    <div className="aquarium-card" aria-label="Fictional aquarium preview for Mabini 9 class">
      <div className="aquarium-topbar">
        <div>
          <span className="eyebrow light">Fictional preview</span>
          <strong>Mabini 9 Aquarium</strong>
        </div>
        <span className="class-pill">24 learners</span>
      </div>
      <div className="water-scene">
        <div className="water-light" />
        <div className="bubble bubble-one" />
        <div className="bubble bubble-two" />
        <div className="bubble bubble-three" />
        {previewFish.map((item) => (
          <div
            className="preview-fish"
            style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: item.delay }}
            key={item.name}
          >
            <FishIllustration
              fish={item.fish}
              points={item.points}
              hasGlow={item.hasGlow}
              isSwimming={true}
              width={75}
              height={45}
            />
            <span className="fish-label">
              <b>{item.name}</b>
              <small>{item.fish.name} ({item.points} pts)</small>
            </span>
          </div>
        ))}
        <div className="coral coral-left" aria-hidden="true" />
        <div className="plant plant-one" aria-hidden="true" />
        <div className="plant plant-two" aria-hidden="true" />
        <div className="sand" aria-hidden="true" />
      </div>
      <div className="challenge-strip">
        <span className="challenge-icon" aria-hidden="true">
          ✦
        </span>
        <div>
          <strong>Question Quest</strong>
          <span>14 of 20 thoughtful questions</span>
        </div>
        <div className="mini-progress" aria-label="70 percent complete">
          <span style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}
