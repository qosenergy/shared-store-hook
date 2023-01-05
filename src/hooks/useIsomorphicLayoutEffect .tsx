import { useEffect, useLayoutEffect } from "react"

// eslint-disable-next-line no-negated-condition
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
