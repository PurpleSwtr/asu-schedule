import { ref, computed } from "vue"

export interface MonthlyEntry {
  subject: string
  type: string
  day: string
  time: string
  firstDate: string
  intervalWeeks: number
  note: string
}

export interface Lesson {
  time: string
  number: number
  paraNumber: number
  subject: string
  type: string
  room: string
  teacher: string
  schedule: "числитель" | "знаменатель" | "обе" | "месяц" | "полныйдень"
  day: string
  monthlyKey?: string
}

export interface BreakSlot {
  type: "break"
  fromPara: number
  toPara: number
}

export type ScheduleSlot = Lesson | BreakSlot

const TIME_SLOTS: Record<number, string> = {
  1: "08:15-09:45",
  2: "09:55-11:25",
  3: "11:35-13:05",
  4: "12:20-13:50",
  5: "13:55-15:25",
  6: "15:35-17:05",
  7: "17:15-18:45",
}

const TIME_TO_PARA: Record<string, number> = Object.fromEntries(
  Object.entries(TIME_SLOTS).map(([k, v]) => [v, Number(k)]),
)

function resolveParaNumber(timeStr: string): number {
  const clean = timeStr.replace(/\s/g, "")
  if (TIME_TO_PARA[clean]) return TIME_TO_PARA[clean]
  const start = clean.split("-")[0]
  for (const [para, slot] of Object.entries(TIME_SLOTS)) {
    if (slot.split("-")[0] === start) return Number(para)
  }
  return 0
}

function getParaEndTime(para: number): string {
  const slot = TIME_SLOTS[para]
  return slot ? slot.split("-")[1] : ""
}

function getParaStartTime(para: number): string {
  const slot = TIME_SLOTS[para]
  return slot ? slot.split("-")[0] : ""
}

export interface Week {
  number: number
  type: "numerator" | "denominator"
  dates: string
}

export interface GroupSchedule {
  name: string
  days: {
    [dayName: string]: Lesson[]
  }
  monthlySchedule: {
    [key: string]: MonthlyEntry
  }
}

export interface ScheduleData {
  meta: {
    university: string
    semester: string
    updated: string
    weeks: { [weekNumber: string]: Week }
  }
  groups: {
    [groupId: string]: GroupSchedule
  }
}

const DAYS_ORDER = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
]

const SEMESTER_START = "2026-09-01"

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getTime())
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getFirstWeekMonday(): Date {
  return getMondayOfWeek(new Date(SEMESTER_START + "T00:00:00"))
}

const currentGroup = ref("4бАСУ1")
const currentWeek = ref(1)
const currentDay = ref(DAYS_ORDER[0])
const scheduleData = ref<ScheduleData | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

function makeMonthlyKey(day: string, time: string, subject: string): string {
  const dayAbbr: Record<string, string> = {
    Понедельник: "Пн",
    Вторник: "Вт",
    Среда: "Ср",
    Четверг: "Чт",
    Пятница: "Пт",
    Суббота: "Сб",
  }
  const d = dayAbbr[day] || day.slice(0, 2)
  const t = time.replace(/\s/g, "").split("-")[0]
  const replacements: [string, string][] = [
    ["Научно-исследовательская работа", "НИР"],
    [
      "Проектирование и эксплуатация интегрированных автоматизированных систем управления",
      "ПроектированиеИАСУ",
    ],
    ["Технологии разработки приложений для мобильных устройств", "МобПрил"],
    ["Системы искусственного интеллекта", "СИИ"],
    [
      "Облачные вычисления, облачные программные приложения и сервисы",
      "Облачные",
    ],
    ["Управление ресурсами предприятия", "УРП"],
    ["Системы реального времени", "СРВ"],
    ["Базы данных", "БД"],
  ]
  let s = subject
  for (const [from, to] of replacements) {
    s = s.replace(from, to)
  }
  return `${d}_${t}_${s}`
}

function mapPeriodicity(p: string): Lesson["schedule"] {
  const lower = p.toLowerCase().trim()
  if (lower === "еженедельно") return "обе"
  if (lower === "числитель") return "числитель"
  if (lower === "знаменатель") return "знаменатель"
  if (lower.includes("числ") && lower.includes("месяц")) return "месяц"
  if (lower.includes("знам") && lower.includes("месяц")) return "месяц"
  if (lower.includes("полнодневн")) return "полныйдень"
  return "обе"
}

function parseTimeNumber(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return 99
  return parseInt(match[1]) * 100 + parseInt(match[2])
}

function buildWeeklySchedule(
  data: any[],
  monthlySchedule: { [key: string]: MonthlyEntry },
): { [dayName: string]: Lesson[] } {
  const days: { [dayName: string]: any[] } = {}
  for (const item of data) {
    const day = item.day.trim()
    if (!days[day]) days[day] = []
    days[day].push(item)
  }

  const result: { [dayName: string]: Lesson[] } = {}
  for (const [dayName, lessons] of Object.entries(days)) {
    result[dayName] = (lessons as any[])
      .map((item: any) => {
        const time = item.time.trim()
        const subject = item.subject.trim()
        const schedule = mapPeriodicity(item.periodicity || "")
        let monthlyKey: string | undefined

        if (schedule === "месяц") {
          const key = makeMonthlyKey(dayName, time, subject)
          if (monthlySchedule[key]) {
            monthlyKey = key
          }
        }

        return {
          time,
          subject,
          type: item.type.trim(),
          room: (item.room || "").trim(),
          teacher: (item.teacher || "").trim().replace(/\s+/g, " "),
          schedule,
          day: dayName,
          number: 0,
          paraNumber: resolveParaNumber(time),
          monthlyKey,
        }
      })
      .sort(
        (a: Lesson, b: Lesson) =>
          a.paraNumber - b.paraNumber ||
          parseTimeNumber(a.time) - parseTimeNumber(b.time),
      )
      .map((l: Lesson, i: number) => ({ ...l, number: i + 1 }))
  }
  return result
}

function buildWeeks(
  startDateStr: string,
  totalWeeks: number = 18,
): { [weekNumber: string]: Week } {
  const weeks: { [weekNumber: string]: Week } = {}
  const start = getMondayOfWeek(new Date(startDateStr + "T00:00:00"))
  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = new Date(start)
    weekStart.setDate(start.getDate() + i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const d1 = `${weekStart.getDate().toString().padStart(2, "0")}.${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`
    const d2 = `${weekEnd.getDate().toString().padStart(2, "0")}.${(weekEnd.getMonth() + 1).toString().padStart(2, "0")}`
    weeks[(i + 1).toString()] = {
      number: i + 1,
      type: i % 2 === 0 ? "numerator" : "denominator",
      dates: `${d1} – ${d2}`,
    }
  }
  return weeks
}

export const useSchedule = () => {
  const toast = useToast()
  const loadSchedule = async () => {
    try {
      isLoading.value = true
      error.value = null
      const config = useRuntimeConfig()
      const baseURL = config.app?.baseURL || "/"

      const groupsRaw: Record<
        string,
        {
          group: string
          data: any[]
          monthlySchedule?: { [key: string]: MonthlyEntry }
        }
      > = {}

      let manifestGroups: { id: string; file: string }[] = []
      try {
        const manifest = await $fetch<{
          groups: { id: string; file: string }[]
        }>(`${baseURL}groups-manifest.json`)
        manifestGroups = manifest?.groups || []
      } catch (e) {
        console.warn("Failed to load groups-manifest.json:", e)
      }

      if (manifestGroups.length === 0) {
        manifestGroups = [
          { id: "4бАСУ1", file: "4bASU1.json" },
          { id: "4бАСУ2", file: "4bASU2.json" },
        ]
      }

      for (const gf of manifestGroups) {
        try {
          const resp = await $fetch<{
            group: string
            data: any[]
            monthlySchedule?: { [key: string]: MonthlyEntry }
          }>(`${baseURL}${gf.file}`)
          if (resp && resp.data) {
            groupsRaw[gf.id] = resp
          }
        } catch (e) {
          console.warn(`Failed to load ${gf.file}:`, e)
        }
      }

      if (Object.keys(groupsRaw).length === 0) {
        throw new Error("Не удалось загрузить ни одно расписание")
      }

      const groups: { [groupId: string]: GroupSchedule } = {}
      for (const [id, raw] of Object.entries(groupsRaw)) {
        const ms = raw.monthlySchedule || {}
        groups[id] = {
          name: raw.group || id,
          days: buildWeeklySchedule(raw.data, ms),
          monthlySchedule: ms,
        }
      }

      const weeks = buildWeeks(SEMESTER_START)

      scheduleData.value = {
        meta: {
          university: "МАДИ",
          semester: "2026-2027 Осенний",
          updated: new Date().toISOString().slice(0, 10),
          weeks,
        },
        groups,
      }

      const savedGroup = localStorage.getItem("asu-schedule-group")
      if (savedGroup && groups[savedGroup]) {
        currentGroup.value = savedGroup
      }

      const now = new Date()
      const firstMonday = getFirstWeekMonday()
      firstMonday.setHours(0, 0, 0, 0)
      const diffDays = Math.floor(
        (now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24),
      )
      const weekNum = Math.floor(diffDays / 7) + 1
      if (weekNum >= 1 && weekNum <= 18) {
        currentWeek.value = weekNum
      }

      const dayIdx = (now.getDay() + 6) % 7
      currentDay.value = DAYS_ORDER[dayIdx]
    } catch (e) {
      error.value = "Ошибка загрузки расписания"
      console.error("Failed to load schedule:", e)
    } finally {
      isLoading.value = false
    }
  }

  const groups = computed(() => {
    if (!scheduleData.value) return []
    return Object.entries(scheduleData.value.groups).map(([id, g]) => ({
      id,
      name: g.name,
    }))
  })

  const weeks = computed(() => {
    if (!scheduleData.value) return []
    return Object.values(scheduleData.value.meta.weeks).sort(
      (a, b) => a.number - b.number,
    )
  })

  const currentWeekData = computed<Week | null>(() => {
    if (!scheduleData.value) return null
    return scheduleData.value.meta.weeks[currentWeek.value.toString()] || null
  })

  const currentWeekType = computed<"numerator" | "denominator" | null>(() => {
    return currentWeekData.value?.type || null
  })

  const days = computed(() => DAYS_ORDER)

  const weekDaysWithDates = computed(() => {
    const weekStart = new Date(getFirstWeekMonday())
    weekStart.setDate(weekStart.getDate() + (currentWeek.value - 1) * 7)
    return DAYS_ORDER.map((name, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const dd = d.getDate().toString().padStart(2, "0")
      const mm = (d.getMonth() + 1).toString().padStart(2, "0")
      return { name, date: `${dd}.${mm}` }
    })
  })

  const groupDays = computed(() => {
    if (!scheduleData.value || !currentGroup.value) return null
    return scheduleData.value.groups[currentGroup.value]?.days || null
  })

  const currentMonthlySchedule = computed(() => {
    if (!scheduleData.value || !currentGroup.value) return {}
    return scheduleData.value.groups[currentGroup.value]?.monthlySchedule || {}
  })

  const buildSlots = (dayName: string): ScheduleSlot[] => {
    if (!groupDays.value || !currentWeekType.value) return []
    const lessons = groupDays.value[dayName] || []
    const filtered = lessons
      .filter((l) =>
        isVisibleInWeek(l, currentWeek.value, currentWeekType.value),
      )
      .sort(
        (a, b) =>
          a.paraNumber - b.paraNumber ||
          parseTimeNumber(a.time) - parseTimeNumber(b.time),
      )
      .map((l, i) => ({ ...l, number: i + 1 }))

    const slots: ScheduleSlot[] = []
    for (let i = 0; i < filtered.length; i++) {
      const lesson = filtered[i]
      if (i > 0) {
        const prev = filtered[i - 1]
        if (lesson.paraNumber > prev.paraNumber + 1) {
          slots.push({
            type: "break",
            fromPara: prev.paraNumber,
            toPara: lesson.paraNumber,
          })
        }
      }
      slots.push(lesson)
    }
    return slots
  }

  const daySchedule = computed<ScheduleSlot[]>(() => buildSlots(currentDay.value))

  const getDaySlots = (dayName: string): ScheduleSlot[] => buildSlots(dayName)

  const hasMonthlyWarning = (groupId: string): boolean => {
    if (!scheduleData.value) return false
    const group = scheduleData.value.groups[groupId]
    if (!group) return false
    const ms = group.monthlySchedule || {}
    if (Object.keys(ms).length > 0) return false
    return Object.values(group.days).some((day) =>
      (day as Lesson[]).some((l) => l.schedule === "месяц"),
    )
  }

  const setGroup = (g: string) => {
    currentGroup.value = g
    localStorage.setItem("asu-schedule-group", g)
    if (hasMonthlyWarning(g)) {
      toast.add({
        icon: "i-lucide-triangle-alert",
        color: "warning",
        title: "Пары «1 раз в месяц»",
        description:
          "Для этой группы нет ручного расписания занятий раз в месяц. Такие пары могут отображаться некорректно - проверьте их вручную.",
        duration: 8000,
      })
    }
  }
  const setWeek = (n: number) => {
    currentWeek.value = n
  }
  const setDay = (d: string) => {
    currentDay.value = d
  }

  const getWeekTypeLabel = (t: "numerator" | "denominator") =>
    t === "numerator" ? "Числитель" : "Знаменатель"

  const isVisibleInWeek = (
    lesson: Lesson,
    weekNumber: number,
    weekType: "numerator" | "denominator",
  ): boolean => {
    switch (lesson.schedule) {
      case "числитель":
        return weekType === "numerator"
      case "знаменатель":
        return weekType === "denominator"
      case "обе":
        return true
      case "полныйдень":
        return weekType === "denominator"
      case "месяц":
        return isMonthlyLessonThisWeek(lesson, weekNumber, weekType)
      default:
        return true
    }
  }

  const isMonthlyLessonThisWeek = (
    lesson: Lesson,
    weekNumber: number,
    weekType: "numerator" | "denominator",
  ): boolean => {
    const ms = currentMonthlySchedule.value

    if (lesson.monthlyKey && ms[lesson.monthlyKey]) {
      const entry = ms[lesson.monthlyKey]
      const interval = entry.intervalWeeks || 4
      const firstWeek = getWeekNumberForDate(entry.firstDate)
      if (firstWeek === null) return false
      if (weekNumber < firstWeek) return false
      return (weekNumber - firstWeek) % interval === 0
    }

    if (weekType === "numerator" && weekNumber % 4 === 1) return true
    if (weekType === "denominator" && weekNumber % 4 === 3) return true
    return false
  }

  const getTypeOfWeek = (weekNumber: number): "numerator" | "denominator" => {
    const w = scheduleData.value?.meta.weeks[weekNumber.toString()]
    return w ? w.type : weekNumber % 2 === 1 ? "numerator" : "denominator"
  }

  const getWeekNumberForDate = (dateStr: string): number | null => {
    if (!scheduleData.value) return null
    const date = new Date(dateStr + "T00:00:00")
    if (isNaN(date.getTime())) return null
    for (const w of Object.values(scheduleData.value.meta.weeks)) {
      if (w.dates) {
        const [d1, d2] = w.dates
          .split(/\s*[–—-]\s*|\s*-\s*/)
          .map((s) => s.trim())
        if (d1 && d2) {
          const [day1, month1] = d1.split(".").map(Number)
          const [day2, month2] = d2.split(".").map(Number)
          const year = date.getFullYear()
          const start = new Date(year, month1 - 1, day1)
          const end = new Date(year, month2 - 1, day2)
          if (date >= start && date <= end) return w.number
        }
      }
    }
    return null
  }

  const getDayNameForDate = (date: Date): string => {
    const idx = (date.getDay() + 6) % 7
    return DAYS_ORDER[idx]
  }

  const selectDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : date
    if (isNaN(d.getTime())) return
    const weekNum = getWeekNumberForDate(d.toISOString().slice(0, 10))
    const dayName = getDayNameForDate(d)
    if (weekNum !== null && weekNum !== undefined) {
      currentWeek.value = weekNum
    }
    currentDay.value = dayName
  }

  return {
    scheduleData,
    isLoading,
    error,
    currentGroup,
    currentWeek,
    currentDay,
    groups,
    weeks,
    currentWeekData,
    currentWeekType,
    days,
    weekDaysWithDates,
    daySchedule,
    getDaySlots,
    loadSchedule,
    setGroup,
    setWeek,
    setDay,
    selectDate,
    getWeekTypeLabel,
    isVisibleInWeek,
    getWeekNumberForDate,
    getParaStartTime,
    getParaEndTime,
    TIME_SLOTS,
  }
}
