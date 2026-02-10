'use client'

import { PieChart, Pie, Cell } from 'recharts'

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
  const data = [
    { name: 'progress', value: Math.min(value, 100) },
    { name: 'remaining', value: 100 - Math.min(value, 100) }
  ]

  const radius = size / 2
  const innerRadius = radius - strokeWidth
  const outerRadius = radius

  // Color based on completion
  const color = value >= 80 ? 'hsl(142, 76%, 36%)' : 'hsl(47, 96%, 53%)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={radius}
          cy={radius}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          <Cell fill={color} />
          <Cell fill="hsl(var(--muted))" />
        </Pie>
      </PieChart>

      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  )
}
