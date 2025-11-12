/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const BRAND_FROM = "#741052";
const BRAND_TO = "#d0269b";
const BRAND_TO1 = "#ff03afff";
const BRAND_GRADIENT_CSS = `linear-gradient(105deg, ${BRAND_FROM}, ${BRAND_TO}, ${BRAND_TO1}, ${BRAND_TO}, ${BRAND_FROM})`;

function toKarachi(now = new Date()) {
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function isOpenAt(karachiDate: Date) {
  let day = karachiDate.getDay();
  
  const h = karachiDate.getHours();
  const m = karachiDate.getMinutes();
  const minutes = h * 60 + m;

  // If time is *after midnight but before cutoff* → treat as previous day
  // because we are still in "last night's session"
  const isEarlyMorning = minutes < 180; // before 3:00 AM safety window
  if (isEarlyMorning) {
    day = (day + 6) % 7; // shift to previous day
  }

  const openStart = 18 * 60 + 30; // 6:30 PM

  // Weekend nights (Fri, Sat, Sun)
  const weekendDays = [5, 6, 0];
  const cutoff = weekendDays.includes(day)
    ? 2 * 60 + 45 // 2:45 AM
    : 0 * 60 + 45; // 12:45 AM

  return minutes >= openStart || minutes < cutoff;
}


function nextOpenAndLastCloseFrom(karachiNow: Date) {
  const openStart = new Date(karachiNow);
  openStart.setHours(18, 30, 0, 0);

  const nextOpen = new Date(openStart); // ← changed let → const

  if (
    karachiNow.getHours() > 18 ||
    (karachiNow.getHours() === 18 && karachiNow.getMinutes() >= 30)
  ) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  const lastClose = new Date(karachiNow);
  lastClose.setHours(2, 0, 0, 0);

  if (karachiNow.getHours() < 2) {
    lastClose.setDate(lastClose.getDate() - 1);
  }
  if (lastClose.getTime() > karachiNow.getTime()) {
    lastClose.setDate(lastClose.getDate() - 1);
  }

  return { nextOpen, lastClose };
}

function getLastOrderTime(karachiDate: Date) {
  const day = karachiDate.getDay(); // 0 Sun .. 6 Sat
  const weekend = [5, 6, 0]; // Fri, Sat, Sun

  const cutoff = new Date(karachiDate);
  cutoff.setSeconds(0, 0);

  if (weekend.includes(day)) {
    // 2:45 AM
    cutoff.setHours(2, 45, 0, 0);
  } else {
    // 12:45 AM
    cutoff.setHours(0, 45, 0, 0);
  }

  return cutoff;
}

export default function RestaurantStatusPopup() {
  const pathname = usePathname() || "";
  const [now, setNow] = useState(() => toKarachi(new Date()));

  useEffect(() => {
    const t = setInterval(() => setNow(toKarachi(new Date())), 1000);
    return () => clearInterval(t);
  }, []);
if (typeof window !== "undefined" && window.location.hostname === "localhost") return null;
if (typeof window !== "undefined" && window.location.hostname === "ordering-system.littlekarachirestaurant.com") return null;


  if (pathname.startsWith("/admin")) return null;
  if (isOpenAt(now)) return null;
  const lastOrderTime = getLastOrderTime(now);

  const { nextOpen, lastClose } = nextOpenAndLastCloseFrom(now);
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

      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-black/80 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="pointer-events-auto relative w-[min(760px,94%)] max-w-3xl rounded-2xl shadow-2xl overflow-hidden bg-white "
        >
          <div
            className="h-2 w-full"
            style={{
              backgroundImage: BRAND_GRADIENT_CSS,
              backgroundSize: "200% 200%",
              animation: "brand-slide 6s ease infinite",
            }}
          />

          <div className="p-6 md:p-8 flex gap-6 items-center">
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

<div className="flex-1 min-w-0">
  <h2
    className="text-2xl md:text-3xl font-bold leading-tight"
    style={{ color: BRAND_FROM }}
  >
    We are currently closed
  </h2>

  <p className="mt-2 text-sm md:text-base text-gray-600 max-w-xl">
Our café is closed right now. We’ll be ready to serve you again at {nextOpen.toLocaleString("en-US", {
            timeZone: "Asia/Karachi",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })}  </p>

  {/* Schedule Card */}
  <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
    <div className="text-sm font-semibold" style={{ color: BRAND_FROM }}>
      Today’s Serving Schedule
    </div>

    <div className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Opens At</span>
        <span className="font-medium" style={{ color: BRAND_TO }}>
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
        <span className="font-medium" style={{ color: BRAND_TO }}>
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

  {/* Divider */}
  <div className="my-6 h-px bg-gray-200" />

  {/* Countdown Text */}
  <div className="text-sm text-gray-500">
    Reopening in:
    <span className="font-mono font-semibold ml-1" style={{ color: BRAND_FROM }}>
      {timeStr}
    </span>
  </div>
</div>

          </div>
        </motion.div>
      </div>
    </>
  );
}
