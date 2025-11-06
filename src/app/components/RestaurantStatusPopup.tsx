// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client'

// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function RestaurantStatusPopup() {
// const pathname = usePathname() || "";
//   const [isClosed, setIsClosed] = useState(false);
//   const [timeRemaining, setTimeRemaining] = useState("");

//   // Karachi Time Calculation
//   const checkTime = () => {
//     const now = new Date();
//     const karachiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
//     const currentMinutes = karachiTime.getHours() * 60 + karachiTime.getMinutes();

//     // Open between: 6:30PM (18:30) → 2:00AM (02:00)
//     const openStart = 18 * 60 + 30; // 18:30
//     const openEnd = 2 * 60;        // 02:00 next day

//     let closed = false;

//     if (openStart < 24 * 60) {
//       if (currentMinutes >= openStart || currentMinutes < openEnd) {
//         closed = false; // OPEN
//       } else {
//         closed = true; // CLOSED
//       }
//     }

//     setIsClosed(closed);

//     if (closed) updateCountdown(karachiTime);
//   };

//   const updateCountdown = (karachiTime: Date) => {
//     // Next opening at 6:30 PM
//     let nextOpen = new Date(karachiTime);
//     nextOpen.setHours(18, 30, 0, 0);

//     if (karachiTime.getHours() > 18 || (karachiTime.getHours() === 18 && karachiTime.getMinutes() >= 30)) {
//       nextOpen.setDate(nextOpen.getDate() + 1);
//     }

//     const diff = nextOpen.getTime() - karachiTime.getTime();
//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff / (1000 * 60)) % 60);

//     setTimeRemaining(`${hours}h ${minutes}m`);
//   };

// useEffect(() => {
//   if (!pathname.startsWith("/admin")) {
//     checkTime();
//     const interval = setInterval(checkTime, 1000 * 60);
//     return () => clearInterval(interval);
//   }
// }, [pathname]);

// if (!isClosed || pathname?.startsWith("/admin")) return null;

//   return (
//     <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center">
//       <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center shadow-2xl max-w-md w-[90%]">
//         <h1 className="text-3xl font-bold text-rose-600">Restaurant Closed</h1>
//         <p className="text-lg mt-3 text-gray-700 dark:text-gray-300">
//           We are currently closed. Please come back when we open.
//         </p>

//         <p className="mt-4 text-lg font-medium">
//           Opens in: <span className="text-purple-600 font-bold">{timeRemaining}</span>
//         </p>
//       </div>
//     </div>
//   );
// }
