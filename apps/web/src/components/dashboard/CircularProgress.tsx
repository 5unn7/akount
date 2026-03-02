'use client'

interface CircularProgressProps {
  value: number  // 0-100
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  value = 0,
  size = 120,
  strokeWidth = 12
}: CircularProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference

  // Amber primary for progress, green for completion
  const color = value >= 80 ? 'var(--ak-green)' : 'var(--primary)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  )
}
