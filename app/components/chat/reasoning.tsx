import { Markdown } from "@/components/prompt-kit/markdown"
import { cn } from "@/lib/utils"
import { Brain, CaretDownIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

type ReasoningProps = {
  reasoning: string
  isStreaming?: boolean
}

const TRANSITION = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
}

export function Reasoning({ reasoning, isStreaming }: ReasoningProps) {
  const [wasStreaming, setWasStreaming] = useState(isStreaming ?? false)
  const [isExpanded, setIsExpanded] = useState(() => isStreaming ?? true)

  if (wasStreaming && isStreaming === false) {
    setWasStreaming(false)
    setIsExpanded(false)
  }

  return (
    <div className="border-border/50 bg-muted/30 rounded-xl border overflow-hidden">
      <button
        className={cn(
          "flex w-full items-center gap-2 px-4 py-2.5 transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          isExpanded && "border-border/50 border-b"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <Brain
          className={cn(
            "size-4 shrink-0 transition-colors",
            isStreaming ? "text-primary animate-pulse" : "text-muted-foreground"
          )}
        />
        <span className="text-sm font-medium">
          {isStreaming ? "Thinking..." : "Reasoning"}
        </span>
        <CaretDownIcon
          className={cn(
            "ml-auto size-3.5 transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
          >
            <div className="text-muted-foreground/90 max-h-80 overflow-y-auto px-4 py-3 text-sm leading-relaxed scrollbar-thin">
              <Markdown>{reasoning}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
