/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// src/components/TableManagement.tsx
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  RefreshCw,
  User,
  Table,
  Check,
  Clock,
  Utensils,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TableStatus = 'empty' | 'reserved' | 'occupied';

export type TableItem = {
  id: string;
  tableNumber: number | string;
  capacity?: number;
  status: TableStatus;
  lastUpdated?: string; // ISO timestamp
  notes?: string;
};

const brandPrimary = '#C46A47';
const brandAccent = '#A65638';

const STATUS_META: Record<
  TableStatus,
  { label: string; colorClass: string; icon: React.ReactNode; tone: string }
> = {
  empty: {
    label: 'Empty',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: <Check className="h-4 w-4" aria-hidden />,
    tone: 'green',
  },
  reserved: {
    label: 'Reserved',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-100',
    icon: <Clock className="h-4 w-4" aria-hidden />,
    tone: 'yellow',
  },
  occupied: {
    label: 'Occupied',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-100',
    icon: <Utensils className="h-4 w-4" aria-hidden />,
    tone: 'red',
  },
};

export default function TableManagement() {
  const { toast } = useToast();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetChange, setTargetChange] = useState<{ id: string; newStatus: TableStatus } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // animation / UI state per-table
  const [statusProgress, setStatusProgress] = useState<Record<string, boolean>>({});
  const [successPulse, setSuccessPulse] = useState<Record<string, boolean>>({});

  // reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // fetching tables
  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = (await res.json()) as TableItem[];
      setTables(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Unknown error fetching tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTables();
      toast({ title: 'Refreshed', description: 'Latest table data loaded.' });
    } catch {
      // handled
    } finally {
      setRefreshing(false);
    }
  };

  const analytics = useMemo(() => {
    const total = tables.length;
    const empty = tables.filter((t) => t.status === 'empty').length;
    const reserved = tables.filter((t) => t.status === 'reserved').length;
    const occupied = tables.filter((t) => t.status === 'occupied').length;
    return { total, empty, reserved, occupied };
  }, [tables]);

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        String(t.tableNumber).toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    });
  }, [tables, query, statusFilter]);

  // small donut (kept as-is but simplified)
  const DonutChart: React.FC = () => {
    const total = Math.max(1, analytics.empty + analytics.reserved + analytics.occupied);
    const radius = 36;
    const stroke = 16;
    let acc = 0;
    const donutData = [
      { key: 'Empty', value: analytics.empty, color: '#10b981' }, // Emerald
      { key: 'Reserved', value: analytics.reserved, color: '#f59e0b' }, // Amber
      { key: 'Occupied', value: analytics.occupied, color: '#e11d48' }, // Rose
    ].filter((d) => d.value > 0);
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Table status distribution">
        <defs>
          <linearGradient id="g1" x1="0%" x2="100%">
            <stop offset="0%" stopColor={brandPrimary} />
            <stop offset="100%" stopColor={brandAccent} />
          </linearGradient>
        </defs>
        <g transform="translate(60,60)">
          {donutData.length === 0 ? (
            <circle r={radius} fill="#f3f4f6" />
          ) : (
            donutData.map((d) => {
              const portion = d.value / total;
              const circumference = 2 * Math.PI * radius;
              const dash = portion * circumference;
              const gap = circumference - dash;
              const rotation = (acc / total) * 360;
              acc += d.value;
              return (
                <g key={d.key} transform={`rotate(${rotation})`}>
                  <circle
                    r={radius}
                    fill="transparent"
                    stroke={d.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeLinecap="butt"
                  />
                </g>
              );
            })
          )}
          <circle r={radius - stroke - 2} fill="white" className="dark:fill-neutral-900" />
          <text x="0" y="-4" textAnchor="middle" fontSize={12} fill="#C46A47" fontWeight={700}>
            {analytics.total}
          </text>
          <text x="0" y="12" textAnchor="middle" fontSize={10} fill="#6b7280">
            Tables
          </text>
        </g>
      </svg>
    );
  };

  // request open confirm
  const requestStatusChange = (id: string, newStatus: TableStatus) => {
    setTargetChange({ id, newStatus });
    setConfirmOpen(true);
  };

  // perform update
  const performStatusUpdate = async () => {
    if (!targetChange) return;
    setModalLoading(true);
    const { id, newStatus } = targetChange;

    // start progress border animation
    setStatusProgress((s) => ({ ...s, [id]: true }));

    try {
      // optimistic update
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus, lastUpdated: new Date().toISOString() } : t)));

      const res = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);

      // success pulse & checkmark
      setSuccessPulse((s) => ({ ...s, [id]: true }));
      setTimeout(() => setSuccessPulse((s) => ({ ...s, [id]: false })), 1800);

      toast({ title: 'Table updated', description: `Table updated to "${newStatus}".` });
    } catch (err) {
      console.error(err);
      // revert by refetch
      fetchTables();
      toast({ title: 'Update failed', description: (err as Error).message || 'Could not update table', variant: 'destructive' });
    } finally {
      // end progress after a short delay to show animation
      setTimeout(() => setStatusProgress((s) => ({ ...s, [id]: false })), 900);
      setModalLoading(false);
      setConfirmOpen(false);
      setTargetChange(null);
    }
  };

  // Framer Motion container for staggered cards
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 10, scale: 0.995 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  // helper: click ripple (creates temporary dot element inside card)
  const createRipple = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.className = 'ripple-effect absolute rounded-full opacity-40';
    btn.appendChild(ripple);
    // remove after animation
    setTimeout(() => ripple.remove(), 600);
  };

  // small utility to format time
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

  return (
    <div className="space-y-6 h-full overflow-y-auto custom-scrollbar">
      {/* inline styles / keyframes needed for ripple & border animations */}
      <style>{`
        .ripple-effect {
          background: radial-gradient(circle, rgba(196,106,71,0.18) 10%, rgba(196,106,71,0.06) 40%, transparent 60%);
          transform: scale(0);
          animation: ripple 600ms ease-out forwards;
          pointer-events: none;
        }
        @keyframes ripple {
          to { transform: scale(2.2); opacity: 0; }
        }
        /* animated border ring (conic) */
        .progress-ring {
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 2px;
          background: conic-gradient(from 0deg, rgba(196,106,71,0.92), rgba(196,106,71,0.3) 45%, rgba(107,63,42,0.08) 70%, rgba(196,106,71,0.0) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0;
          transition: opacity 300ms ease;
        }
        .progress-ring.show { opacity: 1; animation: rotateRing 900ms linear; }
        @keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* subtle glow on hover via CSS var */
        .card-glow-hover:hover { box-shadow: 0 10px 30px rgba(196,106,71,0.12); transform: translateY(-4px); }
        /* badge pulse */
        .badge-pulse { transition: box-shadow 220ms ease; }
        .badge-pulse:hover { box-shadow: 0 6px 20px rgba(196,106,71,0.12); transform: translateY(-2px); }
        /* success checkmark animation */
        .success-check {
          position: absolute;
          right: 12px;
          top: 12px;
          background: linear-gradient(90deg, #C46A47, #A65638);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display:flex;
          align-items:center;
          justify-content:center;
          transform: scale(0);
          animation: check-pop 420ms cubic-bezier(.2,.9,.3,1) forwards;
        }
        @keyframes check-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
        /* graceful fallback for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .card-glow-hover, .ripple-effect, .progress-ring { transition: none !important; animation: none !important; transform: none !important; }
        }
      `}</style>

      {/* Summary + controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: brandPrimary }}>
                    Table Summary
                  </h3>
                  <p className="text-sm text-neutral-500">Quick overview of table statuses</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-sm text-gray-500">
                      <div>Total: <span className="font-semibold" style={{ color: brandPrimary }}>{analytics.total}</span></div>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Empty {analytics.empty}</span>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">Reserved {analytics.reserved}</span>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">Occupied {analytics.occupied}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onRefresh}
                      aria-label="Refresh tables"
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 bg-white/80 hover:bg-white transition-shadow shadow"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6 flex-wrap">
            <div className="flex-1 min-w-0 flex items-center gap-4">
               <Input
                aria-label="Search tables"
                placeholder="Search tables..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-xs focus-visible:ring-[#C46A47] rounded-xl"
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 rounded-full text-sm font-medium ${statusFilter === 'all' ? 'bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white shadow-md' : 'bg-white/60 text-neutral-600'}`}
                  aria-pressed={statusFilter === 'all'}
                >
                  All
                </button>
                 <button
                  onClick={() => setStatusFilter('empty')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${statusFilter === 'empty' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/60 text-emerald-700 hover:bg-emerald-50'}`}
                >
                  Empty
                </button>
                <button
                  onClick={() => setStatusFilter('reserved')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${statusFilter === 'reserved' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white/60 text-amber-700 hover:bg-amber-50'}`}
                >
                  Reserved
                </button>
                <button
                  onClick={() => setStatusFilter('occupied')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${statusFilter === 'occupied' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white/60 text-rose-700 hover:bg-rose-50'}`}
                >
                  Occupied
                </button>
              </div>
            </div>

            <div className="w-36 h-36 flex items-center justify-center">
              <DonutChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block">Error loading tables</strong>
              <span className="text-sm">{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setError(null); fetchTables(); }}>Retry</Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-h-[640px] overflow-y-auto pr-3 custom-scrollbar">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <motion.div key={i} variants={cardVariant} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                  <div className="p-4 bg-white/70 dark:bg-neutral-900/70 rounded-2xl shadow-md animate-pulse h-44" />
                </motion.div>
              ))
              : filtered.length === 0
                ? (
                  <div className="p-6 col-span-full bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-dashed text-center">
                    <p className="text-sm text-gray-600">No tables match your filter.</p>
                  </div>
                )
                : filtered.map((table, idx) => (
                  <motion.article
                    key={table.id}
                    role="article"
                    aria-labelledby={`table-${table.id}-title`}
                    variants={cardVariant}
                    initial="hidden"
                    animate="show"
                    whileHover={!prefersReducedMotion ? { y: -4, boxShadow: '0 10px 30px rgba(196,106,71,0.12)' } : {}}
                    transition={{ type: 'spring' as const, stiffness: 220, damping: 20 }}
                    className="relative"
                  >
                    {/* progress ring (animated border) */}
                    <div className={`progress-ring ${statusProgress[table.id] ? 'show' : ''} rounded-2xl`} aria-hidden />
                    <Card className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-transparent hover:border-transparent">
                      <CardContent className="p-4 h-[240px] flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 id={`table-${table.id}-title`} className="text-lg font-semibold truncate" style={{ color: brandPrimary }}>
                                Table {table.tableNumber}
                              </h4>

                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${STATUS_META[table.status].colorClass} badge-pulse`}
                                title={`Status: ${STATUS_META[table.status].label}`}
                                aria-label={`Status: ${STATUS_META[table.status].label}`}
                                role="status"
                              >
                                {STATUS_META[table.status].icon}
                                <span className="truncate">{STATUS_META[table.status].label}</span>
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mt-2 max-w-xs truncate">{table.notes || 'No notes'}</p>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-4 w-4" />
                                <div>
                                  <div className="text-xs text-gray-500">Capacity</div>
                                  <div className="font-medium text-gray-800">{table.capacity ?? '—'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Table className="h-4 w-4" />
                                <div>
                                  <div className="text-xs text-gray-500">Updated</div>
                                  <div className="font-medium text-gray-800">{fmt(table.lastUpdated)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* floating success check */}
                          <div aria-hidden>
                            {successPulse[table.id] && (
                              <div className="success-check" role="img" aria-label="Success">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* bottom action bar */}
                        <div className="pt-3">
                          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                            <div className="flex flex-col sm:flex-row gap-3 py-2">
                              {/* buttons share equal width on larger screens */}
                              <ActionButton
                                label="Empty"
                                ariaLabel={`Mark table ${table.tableNumber} as empty`}
                                hint="Mark table as empty"
                                tone="green"
                                onClick={(e) => { createRipple(e); requestStatusChange(table.id, 'empty'); }}
                              />
                              <ActionButton
                                label="Reserve"
                                ariaLabel={`Reserve table ${table.tableNumber}`}
                                hint="Reserve table for guests"
                                tone="yellow"
                                onClick={(e) => { createRipple(e); requestStatusChange(table.id, 'reserved'); }}
                              />
                              <ActionButton
                                label="Occupy"
                                ariaLabel={`Mark table ${table.tableNumber} as occupied`}
                                hint="Mark table as occupied"
                                tone="red"
                                primary
                                onClick={(e) => { createRipple(e); requestStatusChange(table.id, 'occupied'); }}
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Table ID: <span className="font-mono text-[11px]">{table.id}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.article>
                ))
            }
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {targetChange ? `Mark table ${tables.find(t => t.id === targetChange.id)?.tableNumber} as ${targetChange.newStatus}?` : ''}
            </p>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
                setTargetChange(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={performStatusUpdate}
              disabled={modalLoading}
              className="bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white rounded-xl shadow-md hover:opacity-90"
            >
              {modalLoading ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------
  ActionButton component
  - equal heights, responsive stacking
  - primary variant uses brand gradient
  - includes accessible tooltip via title and aria-describedby
  - provides press animation and supports ripple
------------------------*/
function ActionButton({
  label,
  ariaLabel,
  hint,
  tone,
  primary = false,
  onClick,
}: {
  label: string;
  ariaLabel?: string;
  hint?: string;
  tone?: 'green' | 'yellow' | 'red';
  primary?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) {
  // local active scale for press animation
  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      title={hint}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setTimeout(() => setIsPressed(false), 80)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      className={`
        relative overflow-hidden flex-1 sm:flex-initial w-full sm:w-auto
        px-4 py-2 rounded-lg text-sm font-medium transition transform
        ${primary ? 'text-white' : 'text-gray-800'}
        ${primary ? '' : tone === 'green' ? 'bg-green-50 hover:bg-green-100' : tone === 'yellow' ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-red-50 hover:bg-red-100'}
        ${primary ? 'bg-gradient-to-r from-[#C46A47] to-[#A65638]' : ''}
        shadow-sm
      `}
      style={{
        minWidth: 0,
        // press animation
        transform: isPressed ? 'scale(0.97)' : undefined,
      }}
      // accessibility
      aria-describedby={hint ? `${label}-hint` : undefined}
    >
      <span className={`inline-flex items-center justify-center gap-2`}>
        {label}
      </span>

      {/* hidden hint for screen readers */}
      {hint && (
        <span id={`${label}-hint`} className="sr-only">{hint}</span>
      )}
    </button>
  );
}
