"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LuxuryConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "warning" | "info";
}

export const LuxuryConfirmModal: React.FC<LuxuryConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  variant = "danger",
}) => {
  const accentColor = variant === "danger" ? "#EF4444" : variant === "warning" ? "#F59E0B" : "#C46A47";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/5"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  <AlertTriangle size={28} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {message}
              </p>
            </div>

            <div className="p-8 pt-0 flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                {cancelLabel}
              </Button>
              <Button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 h-14 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg"
                style={{ 
                    backgroundColor: accentColor,
                    boxShadow: `0 8px 24px -6px ${accentColor}40`
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
