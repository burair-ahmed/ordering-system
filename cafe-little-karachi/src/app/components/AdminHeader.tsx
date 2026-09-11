/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Menu as MenuIcon,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdminHeaderProps {
  activeTabLabel: string;
  activeTabIcon?: React.ComponentType<{ className?: string }>;
  setIsMobileSidebarOpen: (open: boolean) => void;
  audioInitialized: boolean;
  onToggleAudio?: () => void;
  onTestSound?: () => void;
  onLogout: () => void;
}

export default function AdminHeader({
  activeTabLabel,
  activeTabIcon: ActiveIcon,
  setIsMobileSidebarOpen,
  audioInitialized,
  onToggleAudio,
  onTestSound,
  onLogout,
}: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/85 dark:bg-neutral-900/85 px-4 sm:px-6 backdrop-blur-xl shadow-sm transition-colors">

        {/* ── LEFT: Mobile toggle + Breadcrumbs + Live badge ── */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">

          {/* Mobile Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl shrink-0"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open Navigation Drawer"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#5c0d40]/10 dark:bg-[#ff9824]/10 text-[#5c0d40] dark:text-[#ff9824] font-bold text-[11px] uppercase tracking-wider shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CLK Admin</span>
              <span className="sm:hidden">Admin</span>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />

            <div className="flex items-center gap-1.5 font-semibold text-sm text-neutral-900 dark:text-white min-w-0">
              {ActiveIcon && (
                <ActiveIcon className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
              )}
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeTabLabel}</span>
            </div>
          </div>

          {/* System Live Pill — desktop only */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>System Live</span>
          </div>
        </div>

        {/* ── RIGHT: Clock + Audio + Store link + Theme + Lock ── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Live Clock — xl screens only */}
          {mounted && currentTime && (
            <div className="hidden xl:flex flex-col items-end pr-2 mr-1 border-r border-neutral-200 dark:border-neutral-800">
              <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-tight leading-tight">
                {currentTime}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium leading-tight">
                {currentDate}
              </span>
            </div>
          )}

          {/* Audio Alert Status / Test Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (!audioInitialized && onToggleAudio) {
                    onToggleAudio();
                  } else if (audioInitialized && onTestSound) {
                    onTestSound();
                  }
                }}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[11px] font-semibold transition-all duration-200 ${
                  audioInitialized
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                }`}
              >
                {audioInitialized ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Audio On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Audio Off</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {audioInitialized
                ? 'Sound alerts active — click to test chime'
                : 'Sound alerts muted — click to enable'}
            </TooltipContent>
          </Tooltip>

          {/* Live Storefront Quick Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-[#5c0d40]/40 dark:hover:border-[#ff9824]/40 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
              >
                <span>Live Store</span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </Link>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Open customer storefront in new tab</TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          {mounted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl shrink-0"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </TooltipContent>
            </Tooltip>
          )}

          {/* Lock Workspace */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl shrink-0"
                onClick={onLogout}
                aria-label="Lock Admin Workspace"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Lock Workspace &amp; Sign Out</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
