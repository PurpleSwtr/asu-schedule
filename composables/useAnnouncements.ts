export interface AnnouncementItem {
  icon: string
  title: string
  message: string
}

export interface Announcement {
  id: string
  type: "toast" | "modal"
  title: string
  message?: string
  icon?: string
  items?: AnnouncementItem[]
  delay?: number
  duration?: number
  onClose?: () => void
}

const ANNOUNCEMENTS_KEY = "asu-announcements-seen"
const ONBOARDING_KEY = "asu-onboarding-done"

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "first-launch",
    type: "modal",
    title: "Первая обнова!",
    items: [
      {
        icon: "i-lucide-plus",
        title: "Заметки для пар",
        message:
          "Теперь можно писать заметки к любому занятию. Они видны только вам.",
      },
      {
        icon: "i-lucide-file-text",
        title: "Календарь заметок",
        message:
          "Все свои заметки можно просматривать по месяцам в отдельном разделе меню.",
      },
    ],
    onClose: () => useFirstLaunch().markOnboardingDone(),
  },
  {
    id: "swipe-days",
    type: "modal",
    title: "Свайпы!",
    message:
      "Листайте расписание влево-вправо, чтобы менять день недели. Всё для удобства!",
    icon: "i-lucide-unfold-horizontal",
  },
]

const seen = ref<string[]>([])

export const useAnnouncements = () => {
  const init = () => {
    if (import.meta.server) return
    try {
      seen.value = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || "[]")
    } catch {
      seen.value = []
    }

    // Migration: users who already completed onboarding under the old flag
    // must NOT see the first-launch announcement again. Flag name is untouched.
    if (localStorage.getItem(ONBOARDING_KEY)) {
      if (!seen.value.includes("first-launch")) {
        seen.value = [...seen.value, "first-launch"]
        localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(seen.value))
      }
    }
  }

  const pending = computed(() =>
    ANNOUNCEMENTS.filter((a) => !seen.value.includes(a.id)),
  )

  const pendingToasts = computed(() =>
    pending.value.filter((a) => a.type === "toast"),
  )

  const pendingModals = computed(() =>
    pending.value.filter((a) => a.type === "modal"),
  )

  const markSeen = (id: string) => {
    if (!seen.value.includes(id)) {
      seen.value = [...seen.value, id]
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(seen.value))
    }
  }

  return { init, pending, pendingToasts, pendingModals, markSeen }
}