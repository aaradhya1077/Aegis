"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Type definition for DCRM data
type DCRMDataPoint = {
  timestamp: string;
  primary: number;
  secondary: number | null;
  tertiary: number;
  primaryStatus: "healthy" | "fault" | "missing";
  secondaryStatus: "healthy" | "fault" | "missing";
  tertiaryStatus: "healthy" | "fault" | "missing";
};

// DCRM resistance data - reusing the same data for consistency
const dcrmData: DCRMDataPoint[] = [
  { timestamp: "2024-04-01 08:00", primary: 125.5, secondary: 210.3, tertiary: 180.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 09:00", primary: 127.2, secondary: 208.9, tertiary: 182.1, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 10:00", primary: 124.8, secondary: 212.4, tertiary: 179.5, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 11:00", primary: 126.3, secondary: 209.7, tertiary: 181.2, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 12:00", primary: 128.1, secondary: 211.5, tertiary: 183.4, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 13:00", primary: 125.9, secondary: 210.2, tertiary: 180.8, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 14:00", primary: 127.7, secondary: 208.8, tertiary: 182.5, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 15:00", primary: 126.4, secondary: 211.1, tertiary: 181.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 16:00", primary: 128.9, secondary: 209.6, tertiary: 183.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-01 17:00", primary: 127.2, secondary: 210.8, tertiary: 182.0, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 08:00", primary: 126.5, secondary: 211.3, tertiary: 181.5, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 09:00", primary: 128.3, secondary: 209.1, tertiary: 183.2, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 10:00", primary: 125.7, secondary: 212.7, tertiary: 180.4, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 11:00", primary: 127.1, secondary: 210.5, tertiary: 181.9, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 12:00", primary: 129.2, secondary: 208.3, tertiary: 184.1, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 13:00", primary: 126.8, secondary: 211.8, tertiary: 181.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 14:00", primary: 128.5, secondary: 209.4, tertiary: 183.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 15:00", primary: 127.3, secondary: 211.6, tertiary: 182.2, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 16:00", primary: 129.7, secondary: 209.0, tertiary: 184.6, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-02 17:00", primary: 128.0, secondary: 211.2, tertiary: 182.9, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 08:00", primary: 127.4, secondary: 212.0, tertiary: 182.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 09:00", primary: 129.1, secondary: 209.8, tertiary: 184.0, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 10:00", primary: 126.6, secondary: 213.4, tertiary: 181.2, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 11:00", primary: 128.2, secondary: 211.0, tertiary: 182.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 12:00", primary: 130.3, secondary: 208.7, tertiary: 185.0, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 13:00", primary: 127.9, secondary: 212.3, tertiary: 182.5, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 14:00", primary: 129.6, secondary: 209.9, tertiary: 184.1, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 15:00", primary: 128.4, secondary: 212.1, tertiary: 183.0, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 16:00", primary: 130.8, secondary: 209.5, tertiary: 185.4, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-03 17:00", primary: 129.1, secondary: 211.7, tertiary: 183.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 08:00", primary: 128.5, secondary: 212.7, tertiary: 183.1, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 09:00", primary: 130.2, secondary: 210.5, tertiary: 184.8, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 10:00", primary: 127.7, secondary: 214.1, tertiary: 182.0, primaryStatus: "healthy", secondaryStatus: "fault", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 11:00", primary: 129.3, secondary: null, tertiary: 183.5, primaryStatus: "healthy", secondaryStatus: "missing", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 12:00", primary: 131.4, secondary: 209.4, tertiary: 185.8, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 13:00", primary: 129.0, secondary: 213.0, tertiary: 183.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 14:00", primary: 130.7, secondary: 210.6, tertiary: 184.9, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 15:00", primary: 129.5, secondary: 212.8, tertiary: 183.8, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 16:00", primary: 131.9, secondary: 210.2, tertiary: 186.2, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-04 17:00", primary: 130.2, secondary: 212.4, tertiary: 184.5, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 08:00", primary: 129.6, secondary: 213.4, tertiary: 183.9, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 09:00", primary: 131.3, secondary: 211.2, tertiary: 185.6, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 10:00", primary: 128.8, secondary: 214.8, tertiary: 182.8, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 11:00", primary: 130.4, secondary: 212.4, tertiary: 184.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 12:00", primary: 132.5, secondary: 210.1, tertiary: 186.6, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 13:00", primary: 130.1, secondary: 213.7, tertiary: 184.1, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 14:00", primary: 131.8, secondary: 211.3, tertiary: 185.7, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 15:00", primary: 130.6, secondary: 213.5, tertiary: 184.6, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 16:00", primary: 133.0, secondary: 210.9, tertiary: 187.0, primaryStatus: "fault", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
  { timestamp: "2024-04-05 17:00", primary: 131.3, secondary: 213.1, tertiary: 185.3, primaryStatus: "healthy", secondaryStatus: "healthy", tertiaryStatus: "healthy" },
]

const chartConfig = {
  primary: {
    label: "Primary",
    color: "#003366", // Ministry Blue
  },
  secondary: {
    label: "Secondary",
    color: "#FF9933", // Saffron/Energy
  },
  tertiary: {
    label: "Tertiary",
    color: "#138808", // Green/Sustainable
  },
} satisfies ChartConfig

interface DashboardSingleChartProps {
  title: string;
  description: string;
  dataKey: "primary" | "secondary" | "tertiary";
  color: string;
  data?: DCRMDataPoint[];
}

export function DashboardSingleChart({ title, description, dataKey, color, data }: DashboardSingleChartProps) {
  const chartDataToUse = data || dcrmData;
  return (
    <Card className={`border-t-4 shadow-md`} style={{ borderTopColor: color }}>
      <CardHeader>
        <CardTitle style={{ color: color }}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-21/9 w-full max-h-[400px]">
          <LineChart data={chartDataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']} 
              stroke="#666"
              fontSize={12}
              label={{ value: 'Resistance (Ω)', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts() {
  return (
    <div className="grid gap-6 grid-cols-1">
      <DashboardSingleChart 
        title="Primary Resistance" 
        description="Waveform Analysis - Circuit A" 
        dataKey="primary" 
        color="#003366" 
      />
      <DashboardSingleChart 
        title="Secondary Resistance" 
        description="Waveform Analysis - Circuit B" 
        dataKey="secondary" 
        color="#FF9933" 
      />
      <DashboardSingleChart 
        title="Tertiary Resistance" 
        description="Waveform Analysis - Circuit C" 
        dataKey="tertiary" 
        color="#138808" 
      />
    </div>
  )
}
