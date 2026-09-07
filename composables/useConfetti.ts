import JSConfetti from "js-confetti"

export interface ConfettiOptions {
  emojis?: string[]
  emojiCount?: number
  emojiSize?: number
  colorCount?: number
}

const CONFETTI_COLORS = [
  "#f46524",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

let instance: JSConfetti | null = null

export const useConfetti = () => {
  const getInstance = () => {
    if (import.meta.server) return null
    if (!instance) {
      instance = new JSConfetti()
    }
    return instance
  }

  const fire = async (options: ConfettiOptions = {}) => {
    try {
      const confetti = getInstance()
      if (!confetti) return
      const emojis = options.emojis ?? []
      const colorCount = options.colorCount ?? 40
      const emojiCount = options.emojiCount ?? 6
      const emojiSize = options.emojiSize ?? 64

      confetti.addConfetti({
        confettiColors: CONFETTI_COLORS,
        confettiNumber: colorCount,
        confettiRadius: 4,
        emojis: [],
      })
      if (emojis.length > 0) {
        confetti.addConfetti({
          emojis,
          confettiNumber: emojiCount,
          emojiSize,
        })
      }
    } catch {
      /* ignore confetti errors */
    }
  }

  return { fire }
}