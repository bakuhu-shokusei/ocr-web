interface Position {
  clientX: number
  clientY: number
}

export function createDragHandler(
  fn: (initPosition: Position) =>
    | {
        onMove?: (p: Position) => void
        onFinish?: () => void
      }
    | undefined,
) {
  const onMouseDown = (e: MouseEvent) => {
    const initPosition = {
      clientX: e.clientX,
      clientY: e.clientY,
    }

    const { onMove, onFinish } = fn(initPosition) || {}
    if (!onMove) return

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      onFinish?.()
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
  }

  const onTouchStart = (e: TouchEvent) => {
    const initPosition = {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
    }

    const { onMove: _onMove, onFinish } = fn(initPosition) || {}
    if (!_onMove) return

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      _onMove({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      })
    }

    function onEnd() {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      onFinish?.()
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  return { onMouseDown, onTouchStart }
}
