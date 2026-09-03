import colors from 'tailwindcss/colors'

const COLOR_KEY = 'asu-accent-color'

const PALETTES: Record<string, Record<string, string>> = {
  green: colors.green,
  blue: colors.blue,
  slate: colors.slate,
  violet: colors.violet,
  orange: colors.orange,
  red: colors.red,
  amber: colors.amber,
  teal: colors.teal,
  pink: colors.pink,
  indigo: colors.indigo,
  cyan: colors.cyan,
  rose: colors.rose,
}

const LABELS: Record<string, string> = {
  green: 'Зелёный',
  blue: 'Синий',
  slate: 'Серый',
  violet: 'Фиолетовый',
  orange: 'Оранжевый',
  red: 'Красный',
  amber: 'Янтарный',
  teal: 'Бирюзовый',
  pink: 'Розовый',
  indigo: 'Индиго',
  cyan: 'Голубой',
  rose: 'Розовый',
}

export const availableColors = Object.keys(PALETTES).map(key => ({
  value: key,
  label: LABELS[key] || key,
  hex: PALETTES[key][500],
}))

const currentColor = ref('green')

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

function applyColor(name: string) {
  const palette = PALETTES[name]
  if (!palette) return
  const root = document.documentElement

  for (const shade of SHADES) {
    const s = String(shade)
    root.style.setProperty(`--ui-color-primary-${s}`, palette[s])
  }

  root.style.setProperty('--ui-primary', `var(--ui-color-primary-500)`)
  currentColor.value = name
}

export const useAccentColor = () => {
  const init = () => {
    if (import.meta.server) return
    const saved = localStorage.getItem(COLOR_KEY) || 'green'
    if (PALETTES[saved]) applyColor(saved)
  }

  const setColor = (name: string) => {
    applyColor(name)
    localStorage.setItem(COLOR_KEY, name)
  }

  return { currentColor, availableColors, init, setColor }
}
