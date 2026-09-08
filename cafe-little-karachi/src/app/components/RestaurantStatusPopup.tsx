/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, Lock } from "lucide-react";
import { isOpenAt, toKarachi, getNextOpenAndLastClose } from "../lib/restaurantStatus";

const BRAND_FROM = "#741052";
const BRAND_TO = "#d0269b";
const BRAND_TO1 = "#ff03afff";
const BRAND_GRADIENT_CSS = `linear-gradient(105deg, ${BRAND_FROM}, ${BRAND_TO}, ${BRAND_TO1}, ${BRAND_TO}, ${BRAND_FROM})`;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getLastOrderTime(karachiDate: Date) {
  const day = karachiDate.getDay();
  const weekend = [5, 6, 0];

  const cutoff = new Date(karachiDate);
  cutoff.setSeconds(0, 0);

  if (weekend.includes(day)) {
    cutoff.setHours(2, 45, 0, 0);
  } else {
    cutoff.setHours(0, 45, 0, 0);
  }

  return cutoff;
}

export default function RestaurantStatusPopup() {
  const pathname = usePathname() || "";
  const [now, setNow] = useState(() => toKarachi(new Date()));
  const [isBrowseMode, setIsBrowseMode] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedMode = sessionStorage.getItem("clk_browse_only_mode");
      if (storedMode === "true") {
        setIsBrowseMode(true);
      }
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(toKarachi(new Date())), 1000);
    return () => clearInterval(t);
  }, []);

  const handleEnableBrowseMode = () => {
    setIsBrowseMode(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("clk_browse_only_mode", "true");
    }
  };

  const handleOpenPopup = () => {
    setIsBrowseMode(false);
  };

  if (!isMounted) return null;
  if (pathname.startsWith("/admin")) return null;
  if (isOpenAt(now)) return null;

  const lastOrderTime = getLastOrderTime(now);
  const { nextOpen, lastClose } = getNextOpenAndLastClose(now);
  const diffMs = Math.max(0, nextOpen.getTime() - now.getTime());
  const totalClosedMs = Math.max(1, nextOpen.getTime() - lastClose.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const percent = Math.min(
    100,
    Math.max(0, Math.round(((totalClosedMs - diffMs) / totalClosedMs) * 100))
  );
  const R = 44;
  const C = 2 * Math.PI * R;
  const dashOffset = C - (percent / 100) * C;

  const gradientAnimation = `
    @keyframes brand-slide {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  return (
    <>
      <style>{gradientAnimation}</style>

      {/* Bottom-right compact toast when browsing menu while closed */}
      {isBrowseMode && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="fixed bottom-5 right-4 z-[60] w-[clamp(200px,88vw,280px)] bg-slate-950/95 backdrop-blur-xl border border-amber-500/30 text-white rounded-2xl p-3 shadow-2xl"
        >
          {/* Pulsing dot + label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <p className="font-bold text-amber-300 text-[11px] leading-tight">
              Browse Only · Opens 6:30 PM
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-base font-bold text-white tracking-wider">
              {timeStr}
            </span>
            <button
              onClick={handleOpenPopup}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center gap-1 text-[10px] flex-shrink-0 border border-white/10"
            >
              <Clock size={10} className="text-amber-400" />
              <span>Timer</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Fullscreen Popup Modal when closed */}
      {!isBrowseMode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-black/80 pointer-events-auto p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="pointer-events-auto relative w-[min(760px,96%)] max-w-3xl rounded-3xl shadow-2xl overflow-hidden bg-white my-auto"
          >
            <div
              className="h-2.5 w-full"
              style={{
                backgroundImage: BRAND_GRADIENT_CSS,
                backgroundSize: "200% 200%",
                animation: "brand-slide 6s ease infinite",
              }}
            />

            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div
                  className="rounded-full p-1"
                  style={{
                    background: `conic-gradient(${BRAND_FROM}, ${BRAND_TO}, ${BRAND_TO1})`,
                    padding: 4,
                  }}
                >
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0" stopColor={BRAND_FROM} />
                        <stop offset="0.5" stopColor={BRAND_TO} />
                        <stop offset="1" stopColor={BRAND_TO1} />
                      </linearGradient>
                    </defs>
                    <g transform="translate(55,55)">
                      <circle
                        r={R}
                        stroke="rgba(0,0,0,0.06)"
                        fill="transparent"
                        strokeWidth="10"
                      />
                      <circle
                        r={R}
                        stroke="url(#g1)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={C}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90)"
                        style={{ transition: "stroke-dashoffset 0.6s linear" }}
                      />
                      <circle r={28} fill="white" />
                      <g transform="translate(-10,-10)" fill={BRAND_FROM}>
                        <Clock width="20" height="20" />
                      </g>
                    </g>
                  </svg>
                </div>

                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500">
                    Opens In
                  </div>
                  <div
                    className="font-mono text-lg md:text-xl font-semibold"
                    style={{ color: BRAND_FROM }}
                  >
                    {timeStr}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{percent}%</div>
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                  <Lock size={12} />
                  <span>Currently Closed • Opens at 6:30 PM</span>
                </div>
                <h2
                  className="text-2xl md:text-3xl font-black leading-tight"
                  style={{ color: BRAND_FROM }}
                >
                  We are currently closed
                </h2>

                <p className="mt-2 text-sm md:text-base text-gray-600 max-w-xl">
                  Our café is closed right now. We’ll be ready to take your orders again at{" "}
                  <strong className="text-slate-900 font-bold">
                    {nextOpen.toLocaleString("en-US", {
                      timeZone: "Asia/Karachi",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </strong>.
                </p>

                {/* Schedule Card */}
                <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-gray-50 shadow-sm text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Today’s Serving Schedule
                  </div>

                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Opens At</span>
                      <span className="font-semibold" style={{ color: BRAND_TO }}>
                        {nextOpen.toLocaleString("en-US", {
                          timeZone: "Asia/Karachi",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Last Order Time</span>
                      <span className="font-semibold" style={{ color: BRAND_TO }}>
                        {lastOrderTime.toLocaleString("en-US", {
                          timeZone: "Asia/Karachi",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON: VIEW MENU ONLY */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleEnableBrowseMode}
                    className="w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#741052] to-[#d0269b] hover:from-[#5c0d40] hover:to-[#741052] text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
                  >
                    <Eye size={20} className="group-hover:scale-110 transition-transform text-amber-300" />
                    <span>View Menu (Browse Only)</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
