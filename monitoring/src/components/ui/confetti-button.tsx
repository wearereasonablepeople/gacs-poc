"use client"

import { useRef } from "react"
import confetti from "canvas-confetti"

import { Button } from "@/components/ui/button"

interface ConfettiButtonProps extends React.ComponentProps<typeof Button> {
  particleCount?: number
  spread?: number
}

export function ConfettiButton({
  particleCount = 60,
  spread = 50,
  onClick,
  ...props
}: ConfettiButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleConfetti = () => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()

    confetti({
      particleCount,
      spread,
      colors: ["#FFA8CD", "#000000", "#B798BE"],
      scalar: 0.8,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
    })
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    handleConfetti()
    onClick?.(event)
  }

  return <Button ref={buttonRef} onClick={handleClick} {...props} />
}

