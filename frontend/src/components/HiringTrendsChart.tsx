import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface HiringTrendsChartProps {
  departments: Record<string, number>
  currentYear?: number
  previousYear?: number
}

const HiringTrendsChart: React.FC<HiringTrendsChartProps> = ({ 
  departments
}) => {
  // Convert departments object to array for the chart
  const data = Object.entries(departments).map(([name, count]) => ({
    department: name,
    jobs: count
  }))

  // Color palette for different departments - green and red/coral to match screenshot
  const colors = ['#4ADE80', '#F87171']

  return (
    <div className="w-full h-80">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Hiring Trends by Department</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="department" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Number of Jobs', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              offset: 0
            }}
          />
          <Tooltip 
            formatter={(value: number) => [value, 'Jobs']}
            labelFormatter={(label: string) => `Department: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="jobs" radius={[4, 4, 0, 0]}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
    </div>
  )
}

export default HiringTrendsChart
