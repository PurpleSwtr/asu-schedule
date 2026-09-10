import colors from 'tailwindcss/colors'

const COLOR_KEY = 'asu-accent-color'
const CUSTOM_KEY = 'asu-accent-custom'

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
  custom: 'Свой цвет',
}

export const availableColors = Object.keys(PALETTES).map(key => ({
  value: key,
  label: LABELS[key] || key,
  hex: PALETTES[key][500],
}))

export const accentHex = (name: string, shade = 500) => {
  if (name.startsWith('#')) return name
  return PALETTES[name]?.[String(shade)] ?? "#6b7280"
}

const currentColor = ref('green')
const customHex = ref<string | null>(null)

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  const int = parseInt(h, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  const r = Math.round(pa.r + (pb.r - pa.r) * t)
  const g = Math.round(pa.g + (pb.g - pa.g) * t)
  const bl = Math.round(pa.b + (pb.b - pa.b) * t)
  return `#${[r, g, bl].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

function buildCustomPalette(hex: string): Record<string, string> {
  const white = '#ffffff'
  const black = '#000000'
  return {
    '50': mixHex(hex, white, 0.95),
    '100': mixHex(hex, white, 0.9),
    '200': mixHex(hex, white, 0.75),
    '300': mixHex(hex, white, 0.5),
    '400': mixHex(hex, white, 0.25),
    '500': hex,
    '600': mixHex(hex, black, 0.2),
    '700': mixHex(hex, black, 0.4),
    '800': mixHex(hex, black, 0.6),
    '900': mixHex(hex, black, 0.8),
    '950': mixHex(hex, black, 0.92),
  }
}

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

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

function applyCustom(hex: string) {
  PALETTES.custom = buildCustomPalette(hex)
  customHex.value = hex.toLowerCase()
  applyColor('custom')
}

export type ChipStyle = 'pastel' | 'tonal' | 'transparent'

export const useAccentColor = () => {
  const colorMode = useColorMode()

  const CHIP_STYLE_KEY = 'asu-chip-style'
  const LEGACY_TINT_KEY = 'asu-accent-tint'
  const chipStyle = ref<ChipStyle>('pastel')

  const applyThemeShades = () => {
    if (import.meta.server) return
    const palette = PALETTES[currentColor.value]
    if (!palette) return
    const root = document.documentElement
    const style = chipStyle.value
    let c50 = palette['50']
    let c100 = palette['100']
    if (style === 'tonal') {
      c50 = 'color-mix(in srgb, var(--ui-color-primary-500) 22%, transparent)'
      c100 = 'color-mix(in srgb, var(--ui-color-primary-500) 32%, transparent)'
    } else if (style === 'transparent') {
      c50 = 'transparent'
      c100 = 'transparent'
    }
    root.style.setProperty('--ui-color-primary-50', c50)
    root.style.setProperty('--ui-color-primary-100', c100)
  }

  watch(colorMode, () => applyThemeShades())

  const setChipStyle = (value: ChipStyle) => {
    chipStyle.value = value
    localStorage.setItem(CHIP_STYLE_KEY, value)
    applyThemeShades()
  }

  const init = () => {
    if (import.meta.server) return
    const legacy = localStorage.getItem(LEGACY_TINT_KEY)
    const saved = localStorage.getItem(CHIP_STYLE_KEY) || (legacy === '1' ? 'tonal' : 'pastel')
    chipStyle.value = ['pastel', 'tonal', 'transparent'].includes(saved)
      ? (saved as ChipStyle)
      : 'pastel'
    if (legacy !== null) localStorage.removeItem(LEGACY_TINT_KEY)
    const tick = localStorage.getItem(COLOR_KEY) || 'green'
    if (tick === 'custom') {
      const custom = localStorage.getItem(CUSTOM_KEY)
      if (custom && isHex(custom)) {
        applyCustom(custom)
        applyThemeShades()
        return
      }
      applyColor('green')
      applyThemeShades()
      return
    }
    if (PALETTES[tick]) {
      applyColor(tick)
      applyThemeShades()
    }
  }

  const setColor = (name: string) => {
    if (isHex(name)) {
      applyCustom(name)
      localStorage.setItem(COLOR_KEY, 'custom')
      localStorage.setItem(CUSTOM_KEY, name)
      applyThemeShades()
      return
    }
    applyColor(name)
    localStorage.setItem(COLOR_KEY, name)
    applyThemeShades()
  }

  return {
    currentColor,
    customHex,
    chipStyle,
    availableColors,
    init,
    setColor,
    setChipStyle,
    applyThemeShades,
  }
}