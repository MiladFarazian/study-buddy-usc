import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Stable, paint-safe mobile detection to prevent CLS
export function useIsMobile() {
  const getIsMobile = React.useCallback(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
  }, [])

  const subscribe = React.useCallback((callback: () => void) => {
    if (typeof window === "undefined") return () => {}
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = () => callback()
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  // useSyncExternalStore ensures the first client render has the correct value
  const isMobile = React.useSyncExternalStore(subscribe, getIsMobile, () => false)
  return isMobile
}

