import { accentHex } from './useAccentColor'

export type BadgeCategory =
  | 'lab'
  | 'lecture'
  | 'practice'
  | 'numerator'
  | 'denominator'
  | 'monthly'

interface BadgeDefinition {
  key: BadgeCategory
  label: string
  icon?: string
  matchesType?: (type: string) => boolean
  matchesSchedule?: (schedule: string) => boolean
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-zа-яё]/g, '')

export const BADGE_CATEGORIES: BadgeDefinition[] = [
  {
    key: 'lab',
    label: 'Лабораторки',
    icon: 'i-lucide-flask-conical',
    matchesType: (t) => normalize(t).includes('лабораторн'),
  },
  {
    key: 'lecture',
    label: 'Лекции',
    icon: 'i-lucide-speech',
    matchesType: (t) => normalize(t).includes('лекци'),
  },
  {
    key: 'practice',
    label: 'Практические занятия',
    icon: 'i-lucide-notebook-pen',
    matchesType: (t) => normalize(t).includes('практическ'),
  },
  {
    key: 'numerator',
    label: 'Числитель',
    matchesSchedule: (s) => s === 'числитель',
  },
  {
    key: 'denominator',
    label: 'Знаменатель',
    matchesSchedule: (s) => s === 'знаменатель',
  },
  {
    key: 'monthly',
    label: '1 раз в месяц',
    matchesSchedule: (s) => s === 'месяц',
  },
]

const DEFAULTS: Record<BadgeCategory, string> = {
  lab: 'teal',
  lecture: 'indigo',
  practice: 'amber',
  numerator: 'green',
  denominator: 'blue',
  monthly: 'red',
}

const STORAGE_KEY = 'asu-badge-colors'

const badgeColors = ref<Record<BadgeCategory, string>>({ ...DEFAULTS })

export const useBadgeColors = () => {
  const init = () => {
    if (import.meta.server) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      badgeColors.value = { ...DEFAULTS, ...saved }
    } catch {
      badgeColors.value = { ...DEFAULTS }
    }
  }

  const setBadgeColor = (category: BadgeCategory, color: string) => {
    badgeColors.value = { ...badgeColors.value, [category]: color }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(badgeColors.value))
  }

  const softStyle = (category: BadgeCategory) => {
    const hex = accentHex(badgeColors.value[category])
    return {
      color: hex,
      backgroundColor: `color-mix(in srgb, ${hex} 16%, transparent)`,
    }
  }

  const styleForType = (type: string) => {
    const category = BADGE_CATEGORIES.find((c) => c.matchesType?.(type))
    return category ? softStyle(category.key) : null
  }

  const categoryForType = (type: string) =>
    BADGE_CATEGORIES.find((c) => c.matchesType?.(type))

  const styleForSchedule = (schedule: string) => {
    const category = BADGE_CATEGORIES.find((c) => c.matchesSchedule?.(schedule))
    return category ? softStyle(category.key) : null
  }

  return {
    badgeColors,
    BADGE_CATEGORIES,
    init,
    setBadgeColor,
    softStyle,
    styleForType,
    categoryForType,
    styleForSchedule,
  }
}