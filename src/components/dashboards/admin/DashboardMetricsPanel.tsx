'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Users, Package, AlertTriangle, CheckCircle, 
  Clock, DollarSign, Activity, Target, Calendar, RefreshCw 
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/Alert'

// Custom Select component to avoid TypeScript issues
const FormSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className = "" }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
  );
};

// Custom SelectItem component
const FormSelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

// Custom Progress component
const FormProgress: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className = "" }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

// Mock API functions - replace with your actual API implementation
const mockApi = {
  dashboard: {
    getMetrics: async ({ timeRange }: { timeRange: string }) => {
      // Mock data - replace with actual API call
      return {
        overview: {
          total_forms_today: 45,
          total_forms_week: 312,
          active_users: 23,
          completion_rate: 94.5,
          avg_processing_time: 12,
          quality_score: 97.2
        },
        production: {
          daily_throughput: 2400,
          weekly_throughput: 15600,
          yield_percentage: 89.5,
          waste_percentage: 10.5,
          efficiency_score: 92.3,
          stations_active: 8
        },
        quality: {
          passed_inspections: 234,
          failed_inspections: 12,
          pending_reviews: 8,
          compliance_rate: 96.2,
          defect_rate: 3.8,
          rework_rate: 1.2
        },
        trends: {
          daily_production: [
            { date: '2024-01-01', production: 2200, quality: 95 },
            { date: '2024-01-02', production: 2400, quality: 97 },
            { date: '2024-01-03', production: 2100, quality: 94 }
          ],
          form_submissions: [
            { date: '2024-01-01', weight_notes: 12, ppc: 8, fp: 15, qc: 10 },
            { date: '2024-01-02', weight_notes: 15, ppc: 12, fp: 18, qc: 14 },
            { date: '2024-01-03', weight_notes: 10, ppc: 6, fp: 12, qc: 8 }
          ],
          user_activity: [
            { hour: '08:00', active_users: 15, forms_submitted: 8 },
            { hour: '10:00', active_users: 22, forms_submitted: 15 },
            { hour: '12:00', active_users: 18, forms_submitted: 12 }
          ],
          quality_trends: [
            { date: '2024-01-01', passed: 45, failed: 3, pending: 2 },
            { date: '2024-01-02', passed: 52, failed: 2, pending: 1 },
            { date: '2024-01-03', passed: 48, failed: 4, pending: 3 }
          ]
        },
        alerts: {
          critical: 2,
          warning: 5,
          info: 12,
          recent_alerts: [
            {
              id: '1',
              type: 'Temperature Alert',
              message: 'Freezer temperature exceeds threshold',
              timestamp: new Date().toISOString(),
              severity: 'critical' as const
            },
            {
              id: '2',
              type: 'Form Approval',
              message: 'QC form pending approval',
              timestamp: new Date().toISOString(),
              severity: 'warning' as const
            }
          ]
        }
      }
    }
  }
}

interface DashboardMetrics {
  overview: {
    total_forms_today: number
    total_forms_week: number
    active_users: number
    completion_rate: number
    avg_processing_time: number
    quality_score: number
  }
  production: {
    daily_throughput: number
    weekly_throughput: number
    yield_percentage: number
    waste_percentage: number
    efficiency_score: number
    stations_active: number
  }
  quality: {
    passed_inspections: number
    failed_inspections: number
    pending_reviews: number
    compliance_rate: number
    defect_rate: number
    rework_rate: number
  }
  trends: {
    daily_production: Array<{date: string, production: number, quality: number}>
    form_submissions: Array<{date: string, weight_notes: number, ppc: number, fp: number, qc: number}>
    user_activity: Array<{hour: string, active_users: number, forms_submitted: number}>
    quality_trends: Array<{date: string, passed: number, failed: number, pending: number}>
  }
  alerts: {
    critical: number
    warning: number
    info: number
    recent_alerts: Array<{
      id: string
      type: string
      message: string
      timestamp: string
      severity: 'critical' | 'warning' | 'info'
    }>
  }
}

interface DashboardMetricsPanelProps {
  currentUser?: {
    id: string
    username: string
    role: string
  } | null
}

export default function DashboardMetricsPanel({ currentUser }: DashboardMetricsPanelProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')
  const [activeTab, setActiveTab] = useState('overview')

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  useEffect(() => {
    loadMetrics()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadMetrics(true)
    }, 300000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const loadMetrics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await mockApi.dashboard.getMetrics({ timeRange })
      setMetrics(response)
    } catch (err) {
      setError('Failed to load dashboard metrics')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadMetrics(true)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading && !metrics) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading dashboard metrics...</div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">No metrics data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Metrics</h2>
        <div className="flex items-center space-x-2">
          <FormSelect value={timeRange} onValueChange={(value: string) => setTimeRange(value)} className="w-[180px]">
            {timeRanges.map(range => (
              <FormSelectItem key={range.value} value={range.value}>
                {range.label}
              </FormSelectItem>
            ))}
          </FormSelect>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Forms Today</p>
                    <p className="text-2xl font-bold">{metrics.overview.total_forms_today}</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.overview.total_forms_week} this week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{metrics.overview.active_users}</p>
                    <p className="text-xs text-green-600">Online now</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className={`text-2xl font-bold ${getPercentageColor(metrics.overview.completion_rate)}`}>
                      {metrics.overview.completion_rate}%
                    </p>
                    <FormProgress value={metrics.overview.completion_rate} className="w-full h-1 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Processing</p>
                    <p className="text-2xl font-bold">{metrics.overview.avg_processing_time}m</p>
                    <p className="text-xs text-muted-foreground">Per form</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Submissions Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Form Submissions Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.trends.form_submissions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight_notes" stroke="#8884d8" name="Weight Notes" />
                    <Line type="monotone" dataKey="ppc" stroke="#82ca9d" name="PPC Forms" />
                    <Line type="monotone" dataKey="fp" stroke="#ffc658" name="FP Forms" />
                    <Line type="monotone" dataKey="qc" stroke="#ff7300" name="QC Forms" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.trends.user_activity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="active_users" stackId="1" stroke="#8884d8" fill="#8884d8" name="Active Users" />
                    <Area type="monotone" dataKey="forms_submitted" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Forms Submitted" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          {/* Production Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Throughput</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.production.daily_throughput)} kg</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Weekly: {formatNumber(metrics.production.weekly_throughput)} kg
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Yield Rate</p>
                    <p className={`text-2xl font-bold ${getPercentageColor(metrics.production.yield_percentage)}`}>
                      {metrics.production.yield_percentage}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <FormProgress value={metrics.production.yield_percentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className={`text-2xl font-bold ${getPercentageColor(metrics.production.efficiency_score)}`}>
                      {metrics.production.efficiency_score}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant={metrics.production.stations_active > 7 ? "default" : "secondary"}>
                    {metrics.production.stations_active}/9 Stations Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Production & Quality Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.trends.daily_production}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="production" fill="#8884d8" name="Production (kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#ff7300" name="Quality Score (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          {/* Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.quality.passed_inspections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.quality.failed_inspections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{metrics.quality.pending_reviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                    <p className={`text-2xl font-bold ${getPercentageColor(metrics.quality.compliance_rate)}`}>
                      {metrics.quality.compliance_rate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: metrics.quality.passed_inspections, fill: '#00C49F' },
                        { name: 'Failed', value: metrics.quality.failed_inspections, fill: '#FF8042' },
                        { name: 'Pending', value: metrics.quality.pending_reviews, fill: '#FFBB28' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Passed', value: metrics.quality.passed_inspections, fill: '#00C49F' },
                        { name: 'Failed', value: metrics.quality.failed_inspections, fill: '#FF8042' },
                        { name: 'Pending', value: metrics.quality.pending_reviews, fill: '#FFBB28' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.trends.quality_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="passed" stackId="1" stroke="#00C49F" fill="#00C49F" name="Passed" />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#FF8042" fill="#FF8042" name="Failed" />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Pending" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.alerts.critical}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Warning Alerts</p>
                    <p className="text-2xl font-bold text-yellow-600">{metrics.alerts.warning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Info Alerts</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.alerts.info}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.alerts.recent_alerts.map(alert => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{alert.type}</p>
                        </div>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'default' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}