import { Markdown } from "@/components/prompt-kit/markdown"
import { TextShimmer } from "@/components/prompt-kit/text-shimmer"
import { cn } from "@/lib/utils"
import { CaretRightIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

type ReasoningProps = {
  reasoning: string
  isStreaming?: boolean
  onSkip?: () => void
}

const TRANSITION = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
}

export function Reasoning({
  reasoning,
  isStreaming,
  onSkip,
}: ReasoningProps) {
  const [wasStreaming, setWasStreaming] = useState(isStreaming ?? false)
  const [isExpanded, setIsExpanded] = useState(() => isStreaming ?? true)

  if (wasStreaming && isStreaming === false) {
    setWasStreaming(false)
    setIsExpanded(false)
  }

  const leadWord = isStreaming ? "Deep" : "Reasoning"
  const trailText = isStreaming ? "reasoning in progress" : ""

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-1.5 text-sm"
        >
          {isStreaming ? (
            <TextShimmer className="font-semibold" duration={1.8}>
              {leadWord}
            </TextShimmer>
          ) : (
            <span className="text-foreground font-semibold">{leadWord}</span>
          )}
          {trailText && (
            <span className="text-muted-foreground">{trailText}</span>
          )}
          <CaretRightIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              "text-muted-foreground group-hover:text-foreground",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {isStreaming && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
          >
            Skip thinking
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
          >
            <div className="text-muted-foreground/90 border-border/60 mt-3 max-h-80 overflow-y-auto border-l-2 pl-4 text-sm leading-relaxed scrollbar-thin">
              <Markdown>{reasoning}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
