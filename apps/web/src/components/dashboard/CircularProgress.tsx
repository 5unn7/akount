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

  // Amber primary for progress, green for completion
  const color = value >= 80 ? '#34D399' : '#F59E0B'

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
          <Cell fill="rgba(255,255,255,0.06)" />
        </Pie>
      </PieChart>

      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  )
}
