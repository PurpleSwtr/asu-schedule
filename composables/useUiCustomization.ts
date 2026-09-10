const RADIUS_KEY = "asu-ui-radius"
const DARK_VARIANT_KEY = "asu-dark-variant"
const TEXT_SCALE_KEY = "asu-text-scale"
const DENSITY_KEY = "asu-density"

export const RADIUS_OPTIONS = [
  {
    value: "none",
    label: "Без скругления",
    radius: "0rem",
    description: "Прямые углы",
  },
  {
    value: "sm",
    label: "Маленькое",
    radius: "0.125rem",
    description: "Едва заметное",
  },
  {
    value: "md",
    label: "Обычное",
    radius: "0.25rem",
    description: "Как сейчас",
  },
  {
    value: "lg",
    label: "Большое",
    radius: "0.5rem",
    description: "Заметное скругление",
  },
  {
    value: "xl",
    label: "Очень большое",
    radius: "1rem",
    description: "Сильно скруглённое",
  },
]

function parseHex(hex: string): { r: number; g: number; b: number } {
  const int = parseInt(hex.replace("#", ""), 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  const r = Math.round(pa.r + (pb.r - pa.r) * t)
  const g = Math.round(pa.g + (pb.g - pa.g) * t)
  const bl = Math.round(pa.b + (pb.b - pa.b) * t)
  return `#${[r, g, bl].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

export interface DarkVariant {
  value: string
  label: string
  description: string
  base?: string
  ramp?: Record<number, string>
}

function makeRamp(base: string): Record<number, string> {
  const white = "#ffffff"
  const black = "#000000"
  const w = (t: number) => mixHex(base, white, t)
  const b = (t: number) => mixHex(base, black, t)
  return {
    50: w(0.97),
    100: w(0.93),
    200: w(0.86),
    300: w(0.75),
    400: w(0.6),
    500: w(0.42),
    600: w(0.22),
    700: w(0.12),
    800: w(0.05),
    900: base,
    950: b(0.28),
  }
}

function defineVariant(
  value: string,
  label: string,
  description: string,
  base?: string,
): DarkVariant {
  return {
    value,
    label,
    description,
    ...(base ? { base, ramp: makeRamp(base) } : {}),
  }
}

export const DARK_VARIANTS: DarkVariant[] = [
  defineVariant("neutral", "Классический", "Стандартные тёмные цвета"),
  defineVariant("coal", "Угольный", "Почти чёрные, мягкие тона", "#121217"),
  defineVariant("cold", "Холодный", "С синеватым оттенком", "#0f1a26"),
  defineVariant("ocean", "Океан", "Насыщенный сине-бирюзовый", "#0e1e26"),
  defineVariant(
    "violet",
    "Фиолетовый",
    "Тёмные тона с индиго-подтоном",
    "#171226",
  ),
  defineVariant("rose", "Розовый", "Пурпурно-розовый подтон", "#221320"),
  defineVariant("warm", "Тёплый", "Коричнево-янтарные тона", "#1e1710"),
  defineVariant("olive", "Оливковый", "Спокойные зелёно-серые тона", "#161a12"),
  defineVariant("forest", "Лесной", "Глубокий зелёный подтон", "#0f1a12"),
  defineVariant(
    "dim",
    "Дымчатый",
    "Приглушённый серый, мягкий контраст",
    "#23252a",
  ),
  defineVariant(
    "amoled",
    "Чистый чёрный",
    "Истинный чёрный, максимум контраста",
    "#000000",
  ),
]

export interface TextScaleOption {
  value: string
  label: string
  factor: number
  description: string
}

export const TEXT_SCALES: TextScaleOption[] = [
  {
    value: "sm",
    label: "Мелкий",
    factor: 0.9,
    description: "Компактнее текст",
  },
  { value: "md", label: "Обычный", factor: 1, description: "Как сейчас" },
  {
    value: "lg",
    label: "Крупный",
    factor: 1.1,
    description: "Покрупнее текст",
  },
]

export const DENSITY_OPTIONS = [
  {
    value: "compact",
    label: "Компактная",
    spacing: "0.1875rem",
    description: "Меньше отступов",
  },
  {
    value: "normal",
    label: "Обычная",
    spacing: "0.25rem",
    description: "Как сейчас",
  },
  {
    value: "spacious",
    label: "Просторная",
    spacing: "0.3125rem",
    description: "Больше отступов",
  },
]

const TEXT_BASE: Record<string, number> = {
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  "2xl": 1.5,
  "3xl": 1.875,
  "4xl": 2.25,
}

const radius = ref("md")
const darkVariant = ref("neutral")
const textScale = ref("md")
const density = ref("normal")

let variantStyle: HTMLStyleElement | null = null

function applyRadius(v: string) {
  const opt = RADIUS_OPTIONS.find((o) => o.value === v)
  if (!opt) return
  if (import.meta.client) {
    document.documentElement.style.setProperty("--ui-radius", opt.radius)
  }
}

function applyDarkVariant(v: string) {
  if (variantStyle) {
    variantStyle.remove()
    variantStyle = null
  }
  const opt = DARK_VARIANTS.find((o) => o.value === v)
  if (!opt || !opt.ramp) return
  const css =
    "html.dark{\n" +
    Object.entries(opt.ramp)
      .map(([shade, color]) => `--ui-color-neutral-${shade}:${color};`)
      .join("\n") +
    "\n}"
  variantStyle = document.createElement("style")
  variantStyle.id = "asu-dark-variant"
  variantStyle.textContent = css
  document.head.appendChild(variantStyle)
}

function applyTextScale(v: string) {
  const opt = TEXT_SCALES.find((o) => o.value === v)
  if (!opt) return
  const factor = opt.factor
  const root = document.documentElement
  for (const [name, size] of Object.entries(TEXT_BASE)) {
    const val = Math.round(size * factor * 100) / 100
    root.style.setProperty(`--text-${name}`, `${val}rem`)
  }
}

function applyDensity(v: string) {
  const opt = DENSITY_OPTIONS.find((o) => o.value === v)
  if (!opt) return
  document.documentElement.style.setProperty("--spacing", opt.spacing)
}

export const useUiCustomization = () => {
  const init = () => {
    if (import.meta.server) return
    radius.value = localStorage.getItem(RADIUS_KEY) || "md"
    darkVariant.value = localStorage.getItem(DARK_VARIANT_KEY) || "neutral"
    textScale.value = localStorage.getItem(TEXT_SCALE_KEY) || "md"
    density.value = localStorage.getItem(DENSITY_KEY) || "normal"
    applyRadius(radius.value)
    applyDarkVariant(darkVariant.value)
    applyTextScale(textScale.value)
    applyDensity(density.value)
  }

  const setRadius = (v: string) => {
    radius.value = v
    localStorage.setItem(RADIUS_KEY, v)
    applyRadius(v)
  }

  const setDarkVariant = (v: string) => {
    darkVariant.value = v
    localStorage.setItem(DARK_VARIANT_KEY, v)
    applyDarkVariant(v)
  }

  const setTextScale = (v: string) => {
    textScale.value = v
    localStorage.setItem(TEXT_SCALE_KEY, v)
    applyTextScale(v)
  }

  const setDensity = (v: string) => {
    density.value = v
    localStorage.setItem(DENSITY_KEY, v)
    applyDensity(v)
  }

  return {
    RADIUS_OPTIONS,
    DARK_VARIANTS,
    TEXT_SCALES,
    DENSITY_OPTIONS,
    radius,
    darkVariant,
    textScale,
    density,
    init,
    setRadius,
    setDarkVariant,
    setTextScale,
    setDensity,
  }
}
