'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Volume2, Key, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminAuthDialogProps {
  onSuccess: (enableAudio: boolean) => void;
  correctPassword: string;
}

export default function AdminAuthDialog({ onSuccess, correctPassword }: AdminAuthDialogProps) {
  const [authStep, setAuthStep] = useState<'password' | 'notifications'>('password');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === correctPassword) {
        setAuthError('');
        setAuthStep('notifications');
      } else {
        setAuthError('Incorrect secret key. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  const handleComplete = (enableAudio: boolean) => {
    onSuccess(enableAudio);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 dark:bg-black/80 backdrop-blur-md">
      <motion.div
        className="w-full max-w-md"
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <Card className="border border-white/10 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-3xl">
          {/* Decorative colored glow band at top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#741052] via-fuchsia-600 to-pink-500" />
          
          <CardHeader className="space-y-2 text-center pt-8 pb-6 px-6 sm:px-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#741052] to-pink-500 text-white shadow-md shadow-fuchsia-500/20">
              {authStep === 'password' ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {authStep === 'password' ? 'Administrative Access' : 'Sound Alert Preferences'}
            </CardTitle>
            
            <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              {authStep === 'password'
                ? 'Enter the secret system key to unlock the administrator dashboard'
                : 'Allow high-priority sound alerts for instant new order dispatch notifications'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8">
            {authStep === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                  <div className="absolute left-3.5 top-[13px] text-neutral-400">
                    <Key className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secret key..."
                    className="h-12 pl-10 pr-4 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/30 focus-visible:ring-fuchsia-500 font-mono tracking-widest"
                    autoFocus
                    required
                  />
                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{authError}</span>
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-gradient-to-r from-[#741052] to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 shadow-md shadow-fuchsia-500/10 flex items-center justify-center transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    'Verify Identity'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div 
                  onClick={() => setCheckboxChecked(!checkboxChecked)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-all cursor-pointer"
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Enable Audio Alerts
                    </span>
                    <p className="text-xs text-neutral-500">
                      Play notification.mp3 when a new order arrives
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkboxChecked}
                    onChange={(e) => e.stopPropagation()} // Let card click handle toggle
                    onClick={(e) => e.stopPropagation()}
                    className="accent-fuchsia-600 h-5 w-5 rounded-md border-neutral-300 dark:border-neutral-700 cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleComplete(false)}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-neutral-600 hover:bg-neutral-100 border-neutral-200 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800/80 font-medium"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => handleComplete(checkboxChecked)}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#741052] to-pink-500 text-white font-semibold hover:opacity-90 shadow-md shadow-fuchsia-500/10"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
