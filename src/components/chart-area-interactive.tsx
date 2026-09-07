"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend, } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"

export const description = "DCRM Resistance Monitoring Chart with Health Status"

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

// DCRM resistance data with 3 different resistance measurements and health status
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
  resistance: {
    label: "Resistance",
  },
  primary: {
    label: "Primary Resistance",
    color: "var(--chart-1)",
  },
  secondary: {
    label: "Secondary Resistance",
    color: "var(--chart-2)",
  },
  tertiary: {
    label: "Tertiary Resistance",
    color: "var(--chart-3)",
  },
  healthy: {
    label: "Healthy",
    color: "var(--success)",
  },
  fault: {
    label: "Fault",
    color: "var(--destructive)",
  },
  missing: {
    label: "Missing",
    color: "var(--muted)",
  },
} satisfies ChartConfig

// Custom dot component to show different states
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props;
  const statusKey = `${dataKey}Status`;
  const status = payload[statusKey];
  
  if (status === "fault") {
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill="var(--destructive))" 
        stroke="white" 
        strokeWidth={1}
      />
    );
  }
  
  if (status === "missing") {
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill="var(--muted))" 
        stroke="white" 
        strokeWidth={1}
      />
    );
  }
  
  // Default healthy state - no special dot
  return null;
};

export function DcrmResistanceChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("5d")
  const [showStatus, setShowStatus] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("1d")
    }
  }, [isMobile])

  const filteredData = dcrmData.filter((item) => {
    const date = new Date(item.timestamp)
    const referenceDate = new Date("2024-04-05 17:00")
    let daysToSubtract = 5
    if (timeRange === "3d") {
      daysToSubtract = 3
    } else if (timeRange === "1d") {
      daysToSubtract = 1
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  // Count the number of faults and missing data points
  const countStatus = (dataKey: "primary" | "secondary" | "tertiary", status: "healthy" | "fault" | "missing") => {
    return filteredData.filter(item => {
      const statusKey = `${dataKey}Status` as keyof DCRMDataPoint;
      return item[statusKey] === status;
    }).length;
  }

  const primaryFaults = countStatus("primary", "fault");
  const primaryMissing = countStatus("primary", "missing");
  const secondaryFaults = countStatus("secondary", "fault");
  const secondaryMissing = countStatus("secondary", "missing");
  const tertiaryFaults = countStatus("tertiary", "fault");
  const tertiaryMissing = countStatus("tertiary", "missing");

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>DCRM Resistance Monitoring</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Real-time resistance measurements across three circuits with health status
          </span>
          <span className="@[540px]/card:hidden">Resistance measurements</span>
        </CardDescription>
        <CardAction className="flex-col gap-2 sm:flex-row">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="5d">Last 5 days</ToggleGroupItem>
            <ToggleGroupItem value="3d">Last 3 days</ToggleGroupItem>
            <ToggleGroupItem value="1d">Last 24 hours</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 5 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="5d" className="rounded-lg">
                Last 5 days
              </SelectItem>
              <SelectItem value="3d" className="rounded-lg">
                Last 3 days
              </SelectItem>
              <SelectItem value="1d" className="rounded-lg">
                Last 24 hours
              </SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={showStatus ? "show" : "hide"}
            onValueChange={(value) => setShowStatus(value === "show")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="show">Show Status</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide Status</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Status Summary */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Primary</Badge>
            {primaryFaults > 0 && <Badge variant="destructive" className="text-xs">{primaryFaults} Faults</Badge>}
            {primaryMissing > 0 && <Badge variant="secondary" className="text-xs">{primaryMissing} Missing</Badge>}
            {(primaryFaults === 0 && primaryMissing === 0) && <Badge variant="default" className="text-xs bg-green-100 text-green-800">Healthy</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Secondary</Badge>
            {secondaryFaults > 0 && <Badge variant="destructive" className="text-xs">{secondaryFaults} Faults</Badge>}
            {secondaryMissing > 0 && <Badge variant="secondary" className="text-xs">{secondaryMissing} Missing</Badge>}
            {(secondaryFaults === 0 && secondaryMissing === 0) && <Badge variant="default" className="text-xs bg-green-100 text-green-800">Healthy</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Tertiary</Badge>
            {tertiaryFaults > 0 && <Badge variant="destructive" className="text-xs">{tertiaryFaults} Faults</Badge>}
            {tertiaryMissing > 0 && <Badge variant="secondary" className="text-xs">{tertiaryMissing} Missing</Badge>}
            {(tertiaryFaults === 0 && tertiaryMissing === 0) && <Badge variant="default" className="text-xs bg-green-100 text-green-800">Healthy</Badge>}
          </div>
        </div>
        
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `${value} Ω`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Legend />
            <Line
              dataKey="primary"
              type="monotone"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={showStatus ? <CustomDot dataKey="primary" /> : false}
              name="Primary"
              connectNulls={false}
            />
            <Line
              dataKey="secondary"
              type="monotone"
              stroke="var(--color-secondary)"
              strokeWidth={2}
              dot={showStatus ? <CustomDot dataKey="secondary" /> : false}
              name="Secondary"
              connectNulls={false}
            />
            <Line
              dataKey="tertiary"
              type="monotone"
              stroke="var(--color-tertiary)"
              strokeWidth={2}
              dot={showStatus ? <CustomDot dataKey="tertiary" /> : false}
              name="Tertiary"
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
        
        {/* Status Legend */}
        {showStatus && (
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span>Fault</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              <span>Missing</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}