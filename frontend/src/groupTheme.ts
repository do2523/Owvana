import { useEffect } from 'react'

export const SCENE_OPTIONS = [
  { key: 'beach', label: 'Beach' },
  { key: 'city', label: 'City' },
  { key: 'ridge', label: 'Mountains' },
  { key: 'desert', label: 'Desert' },
  { key: 'night', label: 'Night lake' },
  { key: 'snow', label: 'Snow' },
]

// groups that never picked a background get one of the first 3, based on the id
const AUTO_SCENES = ['beach', 'city', 'ridge']

export function sceneFor(group: { _id: string; scene?: string }) {
  if (group.scene && SCENE_OPTIONS.some((s) => s.key === group.scene)) return group.scene
  let n = 0
  for (const ch of group._id) n = (n * 37 + ch.charCodeAt(0)) % 9973
  return AUTO_SCENES[n % AUTO_SCENES.length]
}

// tints the whole page to match the group's picture, theme.css does the colors
export function useGroupTheme(scene: string) {
  useEffect(() => {
    if (!scene) return
    document.documentElement.dataset.scene = scene
    return () => {
      delete document.documentElement.dataset.scene
    }
  }, [scene])
}
