/**
 * Detects touch-first devices.
 *
 * HTML5 drag and drop never fires on iOS or Android browsers, so the file list
 * hides the drag handle there and asks people to use the arrow buttons instead.
 * The check runs after mount because `matchMedia` does not exist during the
 * server side render used for pre-rendering.
 */

import { useEffect, useState } from 'react'

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const query = window.matchMedia('(hover: none) and (pointer: coarse)')
    setIsTouch(query.matches)

    const onChange = (event: MediaQueryListEvent) => setIsTouch(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return isTouch
}
