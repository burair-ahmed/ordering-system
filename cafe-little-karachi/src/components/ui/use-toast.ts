// "use client";

// import * as React from "react";
// import type { ToastProps } from "@/components/ui/toast";

// type Toast = ToastProps & {
//   id: string;
// };

// // ✅ Define context properly
// const ToastContext = React.createContext<{
//   toasts: Toast[];
//   addToast: (toast: Omit<Toast, "id">) => void;
//   removeToast: (id: string) => void;
// } | null>(null);

// // ✅ Provider
// export function ToastProviderCustom({ children }: { children: React.ReactNode }) {
//   const [toasts, setToasts] = React.useState<Toast[]>([]);

//   const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
//     const id = Math.random().toString(36).slice(2);
//     setToasts((prev) => [...prev, { ...toast, id }]);
//   }, []);

//   const removeToast = React.useCallback((id: string) => {
//     setToasts((prev) => prev.filter((t) => t.id !== id));
//   }, []);

//   return (
//     <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
//       {children}
//     </ToastContext.Provider>
//   );
// }

// // ✅ Hook
// export function useToast() {
//   const context = React.useContext(ToastContext);
//   if (!context) {
//     throw new Error("useToast must be used within a ToastProviderCustom");
//   }
//   return context;
// }
