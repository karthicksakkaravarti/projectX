import type { Message as MessageAISDK } from "@/app/types/chat.types"

export function getSources(parts: MessageAISDK["parts"]) {
  const sources = parts
    ?.filter(
      (part) => part.type === "source" || part.type === "tool-invocation"
    )
    .map((part) => {
      if (part.type === "source") {
        return part.source
      }

      if (
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "result"
      ) {
        const result = part.toolInvocation.result as
          | {
              result?: Array<{ citations?: unknown[] }>
            }
          | unknown[]
          | unknown

        if (
          part.toolInvocation.toolName === "summarizeSources" &&
          (result as { result?: Array<{ citations?: unknown[] }> })?.result?.[0]
            ?.citations
        ) {
          return (
            result as { result: Array<{ citations?: unknown[] }> }
          ).result.flatMap((item) => item.citations || [])
        }

        return Array.isArray(result) ? result.flat() : result
      }

      return null
    })
    .filter(Boolean)
    .flat()

  const validSources =
    (sources as Array<{ url?: string } | null | undefined>)?.filter(
      (source) =>
        !!source &&
        typeof source === "object" &&
        !!source.url &&
        source.url !== ""
    ) || []

  return validSources
}
