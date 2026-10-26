export type FishVariety = 'goldfish' | 'koi' | 'guppy' | 'angelfish' | 'betta'

export const FISH_VARIETIES: FishVariety[] = ['goldfish', 'koi', 'guppy', 'angelfish', 'betta']

export function getFishVariety(fishStyle: number): FishVariety {
  const index = Math.abs(fishStyle || 0) % FISH_VARIETIES.length
  return FISH_VARIETIES[index]
}
