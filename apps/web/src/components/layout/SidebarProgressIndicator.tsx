'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client-browser'

interface Progress {
  completionPercentage: number
}

export function SidebarProgressIndicator() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const router = useRouter()

  useEffect(() => {
    apiFetch<Progress>('/api/system/onboarding/progress')
      .then(setProgress)
      .catch(console.error)
  }, [])

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const percentage = progress.completionPercentage
  const isComplete = percentage >= 80
  const barColor = isComplete ? 'bg-[#34D399]' : 'bg-primary'

  return (
    <div
      className="mt-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => router.push('/onboarding/complete')}
      title={`${percentage}% complete - Click to continue setup`}
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
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
