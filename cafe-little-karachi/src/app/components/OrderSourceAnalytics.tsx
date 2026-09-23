'use client';

import React, { FC, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Share2,
  Megaphone,
  Globe,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Target,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart2,
  Calendar,
  Smartphone,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';

interface OrderSourceData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    paidAdsOrders: number;
    paidAdsRevenue: number;
    directOrganicOrders: number;
    paidShare: number;
    topChannel: string;
  };
  sourceBreakdown: Array<{
    label: string;
    source: string;
    count: number;
    revenue: number;
  }>;
  campaignBreakdown: Array<{
    campaign: string;
    source: string;
    label: string;
    count: number;
    revenue: number;
  }>;
  timelineData: Array<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    sources: Record<string, number>;
  }>;
  recentOrders: Array<{
    orderNumber: string;
    customerName: string;
    ordertype: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderSource: {
      source: string;
      label: string;
      campaign?: string;
      medium?: string;
      referrer?: string;
    };
  }>;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; badge: string }> = {
  'Facebook Ads': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    bar: '#2563eb',
    badge: 'bg-blue-600 text-white',
  },
  'Facebook': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-400/30',
    bar: '#3b82f6',
    badge: 'bg-blue-500 text-white',
  },
  'Instagram Ads': {
    bg: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/30',
    bar: '#db2777',
    badge: 'bg-gradient-to-r from-pink-600 to-purple-600 text-white',
  },
  'Instagram': {
    bg: 'bg-pink-500/10',
    text: 'text-pink-500 dark:text-pink-400',
    border: 'border-pink-400/30',
    bar: '#ec4899',
    badge: 'bg-pink-500 text-white',
  },
  'Google Ads': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    bar: '#d97706',
    badge: 'bg-amber-600 text-white',
  },
  'Google Search': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    bar: '#059669',
    badge: 'bg-emerald-600 text-white',
  },
  'TikTok Ads': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    bar: '#0891b2',
    badge: 'bg-cyan-600 text-white',
  },
  'WhatsApp': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    bar: '#10b981',
    badge: 'bg-emerald-600 text-white',
  },
  'Direct / Organic': {
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-600 dark:text-neutral-300',
    border: 'border-neutral-400/30',
    bar: '#6b7280',
    badge: 'bg-neutral-600 text-white',
  },
};

const getSourceStyle = (label: string) => {
  return SOURCE_COLORS[label] || {
    bg: 'bg-fuchsia-500/10',
    text: 'text-[#741052] dark:text-pink-300',
    border: 'border-fuchsia-400/30',
    bar: '#741052',
    badge: 'bg-[#741052] text-white',
  };
};

const formatCurrency = (val: number) => `PKR ${val.toLocaleString()}`;

export const OrderSourceAnalytics: FC = () => {
  const [data, setData] = useState<OrderSourceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // URL Generator state for marketing campaigns
  const [targetPlatform, setTargetPlatform] = useState<string>('facebook');
  const [campaignName, setCampaignName] = useState<string>('ramadan_special');
  const [customLanding, setCustomLanding] = useState<string>('https://cafelittlekarachi.com');

  const generatedUtmUrl = useMemo(() => {
    const base = customLanding.trim() || 'https://cafelittlekarachi.com';
    const params = new URLSearchParams();
    params.set('utm_source', targetPlatform);
    params.set('utm_medium', 'paid_social');
    if (campaignName.trim()) {
      params.set('utm_campaign', campaignName.trim().toLowerCase().replace(/\s+/g, '_'));
    }
    const cleanBase = base.split('?')[0];
    return `${cleanBase}?${params.toString()}`;
  }, [targetPlatform, campaignName, customLanding]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/order-source-analytics?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to load attribution metrics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching order source analytics:', err);
      toast.error('Could not fetch marketing attribution data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUtmUrl);
    setCopiedUrl(true);
    toast.success('Campaign UTM URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-[#741052] to-pink-600 text-white">
              <Megaphone className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
              Marketing & Order Attribution
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Track social media ad performance (Facebook, Instagram, TikTok), referral sources, and Microsoft Clarity integration.
          </p>
        </div>

        {/* Time range pills + Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === t.key
                    ? 'bg-white dark:bg-neutral-700 text-[#741052] dark:text-pink-300 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
            className="h-9 px-3 rounded-xl border-neutral-200 dark:border-neutral-700 font-bold text-xs hover:border-[#741052] hover:text-[#741052] cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#741052]' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Orders */}
          <Card className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#741052]/5 rounded-bl-full pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
                  Total Orders
                </span>
                <span className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <BarChart2 className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {data.summary.totalOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-semibold text-neutral-500">
                Revenue: <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(data.summary.totalRevenue)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Ad-Driven Conversions */}
          <Card className="rounded-3xl border border-blue-500/20 dark:border-blue-500/30 shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-900 dark:to-blue-950/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Paid Ads Orders
                </span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Target className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {data.summary.paidAdsOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>Revenue: {formatCurrency(data.summary.paidAdsRevenue)}</span>
                <Badge className="bg-blue-600 text-white font-bold text-[10px] rounded-lg">
                  {data.summary.paidShare}% Share
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Direct / Organic Orders */}
          <Card className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Organic / Direct
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {data.summary.directOrganicOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-semibold text-neutral-500">
                AOV: <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(data.summary.avgOrderValue)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Top Channel */}
          <Card className="rounded-3xl border border-pink-500/20 dark:border-pink-500/30 shadow-sm bg-gradient-to-br from-white to-pink-50/30 dark:from-neutral-900 dark:to-pink-950/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-bl-full pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  Top Channel
                </span>
                <span className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Flame className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-xl font-black text-pink-600 dark:text-pink-400 mt-2 truncate">
                {data.summary.topChannel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-semibold text-neutral-500">
                Primary conversion source
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SOURCE BREAKDOWN & TIMELINE CHART
      ───────────────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Share Breakdown (Left 1 col) */}
          <Card className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#741052] dark:text-pink-400" />
                  Channel Breakdown
                </h3>
                <span className="text-xs font-bold text-neutral-400">
                  {data.sourceBreakdown.length} Sources
                </span>
              </div>

              <div className="space-y-4">
                {data.sourceBreakdown.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">No order source data available yet.</p>
                ) : (
                  data.sourceBreakdown.map((src) => {
                    const style = getSourceStyle(src.label);
                    const pct = data.summary.totalOrders > 0
                      ? Math.round((src.count / data.summary.totalOrders) * 100)
                      : 0;

                    return (
                      <div key={src.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: style.bar }}
                            />
                            <span className="text-neutral-900 dark:text-white font-extrabold">
                              {src.label}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="text-neutral-500 font-semibold">{src.count} orders</span>
                            <span className="text-neutral-900 dark:text-white font-black">{pct}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: style.bar,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] text-neutral-400 font-semibold px-0.5">
                          <span>Revenue: {formatCurrency(src.revenue)}</span>
                          <span>AOV: {src.count > 0 ? formatCurrency(Math.round(src.revenue / src.count)) : '0'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Daily Timeline Orders Bar Chart (Right 2 cols) */}
          <Card className="lg:col-span-2 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#741052] dark:text-pink-400" />
                  Daily Attributed Orders Timeline
                </h3>
                <span className="text-xs font-bold text-neutral-400">
                  {data.timelineData.length} active days
                </span>
              </div>

              {data.timelineData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
                  No timeline data recorded for this range.
                </div>
              ) : (
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) => val.slice(5)}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <ChartTooltip
                        contentStyle={{
                          borderRadius: '16px',
                          backgroundColor: '#171717',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="totalOrders" name="Total Orders" fill="#741052" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. AD CAMPAIGNS BREAKDOWN TABLE
      ───────────────────────────────────────────────────────────── */}
      {data && (
        <Card className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4.5 w-4.5 text-[#741052] dark:text-pink-400" />
                  Active Ad Campaigns
                </CardTitle>
                <CardDescription className="text-xs">
                  Orders attributed to specific marketing campaigns via <code className="text-[#741052] dark:text-pink-300 font-mono">utm_campaign</code> tags.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-xl px-3 py-1 font-bold text-xs">
                {data.campaignBreakdown.length} Active Campaigns
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {data.campaignBreakdown.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No active campaign tags detected in this period. Use the UTM Generator below to start tagging your Facebook & Instagram ads!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th className="py-3.5 px-6">Campaign Name</th>
                      <th className="py-3.5 px-4">Platform</th>
                      <th className="py-3.5 px-4 text-center">Orders</th>
                      <th className="py-3.5 px-4 text-right">Revenue</th>
                      <th className="py-3.5 px-6 text-right">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                    {data.campaignBreakdown.map((c) => {
                      const style = getSourceStyle(c.label);
                      const aov = c.count > 0 ? Math.round(c.revenue / c.count) : 0;
                      return (
                        <tr key={`${c.campaign}_${c.label}`} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">
                            <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                              {c.campaign}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${style.bg} ${style.text} ${style.border}`}>
                              {c.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-neutral-900 dark:text-white">
                            {c.count}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-neutral-900 dark:text-white">
                            {formatCurrency(c.revenue)}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-neutral-500 dark:text-neutral-400">
                            {formatCurrency(aov)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MARKETING UTM LINK GENERATOR (CLK Tool)
      ───────────────────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-[#741052]/30 dark:border-[#741052]/40 shadow-sm bg-gradient-to-br from-[#741052]/5 via-white to-pink-500/5 dark:from-[#741052]/20 dark:via-neutral-900 dark:to-pink-950/20 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[#741052] dark:text-pink-400" />
          <h3 className="text-base font-black text-neutral-900 dark:text-white">
            Campaign UTM Link Generator
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          Paste these links in your Facebook Ads, Instagram Story links, TikTok bio, or WhatsApp broadcasts to automatically track every single customer and order source.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Platform Selector */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Platform / Source
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'facebook', label: 'Facebook' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'tiktok', label: 'TikTok' },
                { key: 'whatsapp', label: 'WhatsApp' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setTargetPlatform(p.key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    targetPlatform === p.key
                      ? 'bg-[#741052] text-white border-[#741052] shadow-sm'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-[#741052]/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Campaign Identifier
            </label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. ramadan_2026, biryani_promo"
              className="h-10 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Converted to lowercase with underscores</p>
          </div>

          {/* Landing URL */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Destination URL
            </label>
            <Input
              value={customLanding}
              onChange={(e) => setCustomLanding(e.target.value)}
              placeholder="https://cafelittlekarachi.com"
              className="h-10 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Can be homepage or a direct menu link</p>
          </div>
        </div>

        {/* Generated URL Box with Copy Button */}
        <div className="bg-white dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-neutral-800 dark:text-neutral-200 truncate flex-1 select-all">
            {generatedUtmUrl}
          </div>
          <Button
            onClick={handleCopyLink}
            className="h-9 px-4 rounded-xl font-extrabold text-xs bg-[#741052] hover:bg-[#5c0d40] text-white shrink-0 cursor-pointer shadow-sm"
          >
            {copiedUrl ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" /> Copy Tracked Link
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          6. RECENT ATTRIBUTED ORDERS STREAM
      ───────────────────────────────────────────────────────────── */}
      {data && (
        <Card className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-[#741052] dark:text-pink-400" />
                  Recent Attributed Orders Feed
                </CardTitle>
                <CardDescription className="text-xs">
                  Live snapshot of recent orders and their respective traffic sources.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No orders recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th className="py-3.5 px-6">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Attributed Channel</th>
                      <th className="py-3.5 px-4">Campaign</th>
                      <th className="py-3.5 px-4 text-center">Type</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                    {data.recentOrders.map((o) => {
                      const style = getSourceStyle(o.orderSource?.label || 'Direct / Organic');
                      return (
                        <tr key={o.orderNumber} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-neutral-900 dark:text-white">
                            #{o.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                            {o.customerName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${style.bg} ${style.text} ${style.border}`}>
                              {o.orderSource?.label || 'Direct / Organic'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {o.orderSource?.campaign ? (
                              <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[11px]">
                                {o.orderSource.campaign}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge variant="outline" className="uppercase text-[10px] font-bold">
                              {o.ordertype}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-6 text-right font-black text-neutral-900 dark:text-white">
                            {formatCurrency(o.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderSourceAnalytics;
