'use client';

import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  Percent,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Search,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface Metrics {
  totalEvents: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  abandonmentRate: number;
  conversionRate: number;
}

interface FunnelStep {
  name: string;
  value: number;
}

interface PopularItem {
  name: string;
  views: number;
  adds: number;
}

interface DailyActivity {
  date: string;
  count: number;
  visitors: number;
}

interface AnalyticsDashboardData {
  metrics: Metrics;
  funnel: FunnelStep[];
  popularItems: PopularItem[];
  dailyActivity: DailyActivity[];
}

const BehavioralAnalytics: FC = () => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('week');

  const fetchAnalyticsData = async (isManual = false, rangeVal = timeRange) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/dashboard?range=${rangeVal}`);
      if (!response.ok) {
        throw new Error('Failed to load behavioral analytics metrics.');
      }
      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong fetching analytics.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(false, timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-[#741052]" />
        <p className="text-sm font-semibold text-neutral-500 animate-pulse">Loading behavioral analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center px-4">
        <p className="text-rose-500 font-semibold">⚠️ {error || 'Unable to retrieve dashboard metrics'}</p>
        <Button onClick={() => fetchAnalyticsData()} className="bg-[#741052] hover:bg-[#d0269b] text-white rounded-xl">
          Try Again
        </Button>
      </div>
    );
  }

  const { metrics, funnel, popularItems, dailyActivity } = data;

  // Compute funnel conversion metrics
  const totalVisits = funnel[0]?.value || 0;
  const addsCount = funnel[1]?.value || 0;
  const checkoutsCount = funnel[2]?.value || 0;
  const ordersCount = funnel[3]?.value || 0;

  return (
    <div className="space-y-8 p-1">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200/55 dark:border-neutral-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#741052]" />
            Customer Journey & Behavioral Insights
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Analyze self-hosted real-time interaction logs, shopping cart additions, and conversion funnels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="flex bg-neutral-100/80 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200/20">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'all', label: 'All Time' }
            ].map((tab) => {
              const active = timeRange === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    active 
                      ? 'bg-white dark:bg-neutral-700 text-[#741052] dark:text-white shadow-md' 
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => fetchAnalyticsData(true)}
            disabled={isRefreshing}
            variant="outline"
            className="rounded-2xl border-2 hover:border-[#741052] flex items-center gap-2 font-semibold h-11 px-4 shadow-sm transition-all bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#741052]' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Unique Visitors */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="relative overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-[#741052]/10 to-pink-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Unique Visitors
              </CardTitle>
              <div className="p-2 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/20 text-[#741052] dark:text-fuchsia-400">
                <Users className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {metrics.uniqueVisitors}
              </div>
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-2">
                Across {metrics.uniqueSessions} active user sessions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Total Events */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="relative overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Logged Interactions
              </CardTitle>
              <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {metrics.totalEvents}
              </div>
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-2">
                Total custom click & view actions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Conversion Rate */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="relative overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Funnel Conversion
              </CardTitle>
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <Percent className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.conversionRate}%
              </div>
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-2">
                Conversion: Item view to Checkout Success
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: Abandonment Rate */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="relative overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Cart Abandonment
              </CardTitle>
              <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {metrics.abandonmentRate}%
              </div>
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-2">
                Sessions with Add to Cart but no order
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* DETAILED INTERACTIVE FUNNEL VISUALIZATION */}
      <Card className="border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#741052]" />
            Conversion Funnel Drop-off Analysis
          </CardTitle>
          <CardDescription>Identify exactly where customers abandon the purchasing journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-6 items-center">
            {/* Recharts Funnel Chart */}
            <div className="md:col-span-2 h-[260px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      color: '#1f1f1f',
                      fontWeight: 'bold'
                    }}
                  />
                  <Funnel dataKey="value" data={funnel} isAnimationActive>
                    <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Premium Funnel Cards */}
            <div className="md:col-span-3 space-y-4">
              {funnel.map((step, idx) => {
                const prevStepVal = idx > 0 ? funnel[idx - 1].value : step.value;
                const dropOffPercent = idx > 0 && prevStepVal > 0
                  ? Math.round(((prevStepVal - step.value) / prevStepVal) * 100)
                  : 0;
                const conversionFromStart = totalVisits > 0
                  ? Math.round((step.value / totalVisits) * 100)
                  : 0;

                // Color configuration for steps
                const gradients = [
                  'from-[#741052] to-[#8d1d6a]',
                  'from-[#8d1d6a] to-[#a62b82]',
                  'from-[#a62b82] to-[#be3899]',
                  'from-[#be3899] to-[#d0269b]'
                ];

                return (
                  <div key={step.name} className="relative">
                    {idx > 0 && (
                      <div className="absolute -top-3.5 left-10 flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/50">
                        <span>Dropoff: {dropOffPercent}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/60 p-4 rounded-2xl">
                      <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r ${gradients[idx % gradients.length]} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-neutral-800 dark:text-white text-sm">{step.name}</p>
                          <p className="font-black text-neutral-900 dark:text-white text-base">{step.value} <span className="text-xs text-neutral-400 font-medium">sessions</span></p>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full mt-2.5 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${gradients[idx % gradients.length]} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${conversionFromStart}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-neutral-800 dark:text-neutral-200">{conversionFromStart}%</p>
                        <p className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">of total</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Activity Trend */}
        <Card className="border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-neutral-800 dark:text-white">
              {timeRange === 'today' ? 'Hourly Traffic & Activity' : 'Daily Traffic & Interactions'}
            </CardTitle>
            <CardDescription>
              {timeRange === 'today' ? 'Activity logs and unique visitor trends hourly for today.' : 
               timeRange === 'week' ? 'Activity logs and unique visitor trends in the past 7 days.' :
               timeRange === 'month' ? 'Activity logs and unique visitor trends in the past 30 days.' :
               'Activity logs and unique visitor trends in the past 90 days.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#741052" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#741052" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d0269b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d0269b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: '11px', fill: '#888', fontWeight: 'bold' }} />
                <YAxis tickLine={false} style={{ fontSize: '11px', fill: '#888', fontWeight: 'bold' }} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#1f1f1f',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Area type="monotone" name="Total Log Actions" dataKey="count" stroke="#741052" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                <Area type="monotone" name="Unique Visitors" dataKey="visitors" stroke="#d0269b" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Popular Menu Items */}
        <Card className="border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-neutral-800 dark:text-white">Popular Items View vs Add</CardTitle>
            <CardDescription>
              {timeRange === 'today' ? 'Analyze menu and platter engagement: views vs add-to-carts for today.' :
               timeRange === 'week' ? 'Analyze menu and platter engagement: views vs add-to-carts in the past 7 days.' :
               timeRange === 'month' ? 'Analyze menu and platter engagement: views vs add-to-carts in the past 30 days.' :
               'Analyze menu and platter engagement: views vs add-to-carts for all time.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {popularItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm font-semibold text-neutral-400">
                No items tracking views or additions yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" tickLine={false} style={{ fontSize: '10px', fill: '#888', fontWeight: 'bold' }} />
                  <YAxis tickLine={false} style={{ fontSize: '11px', fill: '#888', fontWeight: 'bold' }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      color: '#1f1f1f',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar name="Item Detail Views" dataKey="views" fill="#741052" radius={[6, 6, 0, 0]} />
                  <Bar name="Added to Cart" dataKey="adds" fill="#d0269b" radius={[6, 6, 0, 0]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BehavioralAnalytics;
