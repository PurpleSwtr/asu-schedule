import type JSConfetti from "js-confetti"

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

export const useConfetti = () => {
  if (import.meta.server) {
    return { fire: async () => {} }
  }

  let resolveReady: ((k: JSConfetti) => void) | null = null
  const ready = new Promise<JSConfetti>((r) => {
    resolveReady = r
  })

  const { onLoaded, onError } = useScriptNpm({
    packageName: "js-confetti",
    file: "dist/js-confetti.browser.js",
    version: "0.13.1",
    scriptOptions: {
      use() {
        return { JSConfetti: (window as any).JSConfetti }
      },
    },
  })

  onLoaded(({ JSConfetti: Klass }: { JSConfetti: typeof JSConfetti }) => {
    resolveReady?.(new Klass())
  })
  onError(() => {
    /* quietly ignore script load failures */
  })

  const fire = async (options: ConfettiOptions = {}) => {
    try {
      const instance = await ready
      const emojis = options.emojis ?? []
      const colorCount = options.colorCount ?? 40
      const emojiCount = options.emojiCount ?? 6
      const emojiSize = options.emojiSize ?? 64

      instance.addConfetti({
        confettiColors: CONFETTI_COLORS,
        confettiNumber: colorCount,
        confettiRadius: 4,
        emojis: [],
      })
      if (emojis.length > 0) {
        instance.addConfetti({
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
