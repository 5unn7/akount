'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Progress {
  completionPercentage: number
}

export function SidebarProgressIndicator() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/system/onboarding/progress')
      .then(res => res.json())
      .then(setProgress)
      .catch(console.error)
  }, [])

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const percentage = progress.completionPercentage
  const isGreen = percentage >= 80
  const color = isGreen ? 'bg-green-500' : 'bg-yellow-500'

  return (
    <div
      className="mt-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => router.push('/onboarding/complete')}
      title={`${percentage}% complete - Click to continue setup`}
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage text */}
      <div className="text-xs text-muted-foreground text-center mt-1 font-mono">
        {percentage}%
      </div>
    </div>
  )
}
