"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderType = "delivery" | "pickup" | "dinein" | "";

interface OrderState {
  orderType: OrderType;
  area?: string;
  tableId?: string;
  isCheckoutModalOpen?: boolean;
  isLocationModalOpen?: boolean;
}

interface OrderContextValue extends OrderState {
  setOrder: (order: OrderState) => void;
  clearOrder: () => void;
  setCheckoutModalOpen: (isOpen: boolean) => void;
  setLocationModalOpen: (isOpen: boolean) => void;
  isLocationSet: boolean;
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

const COOKIE_KEYS = {
  orderType: "CLK_ORDER_TYPE",
  area: "CLK_AREA",
  tableId: "CLK_TABLE",
} as const;

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ─── Persist helpers ──────────────────────────────────────────────────────────

function persistOrder(order: OrderState) {
  if (typeof window === "undefined") return;
  const { isCheckoutModalOpen, isLocationModalOpen, ...persistable } = order;
  try {
    localStorage.setItem("order-context", JSON.stringify(persistable));
  } catch {
    /* ignore */
  }
  if (order.orderType) setCookie(COOKIE_KEYS.orderType, order.orderType);
  if (order.area) setCookie(COOKIE_KEYS.area, order.area);
  else deleteCookie(COOKIE_KEYS.area);
  if (order.tableId) setCookie(COOKIE_KEYS.tableId, order.tableId);
  else deleteCookie(COOKIE_KEYS.tableId);
}

function loadPersistedOrder(): OrderState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("order-context");
    if (saved) {
      const parsed = JSON.parse(saved) as OrderState;
      if (parsed.orderType) return parsed;
    }
  } catch {
    /* ignore */
  }
  // Fallback to cookies
  const orderType = getCookie(COOKIE_KEYS.orderType) as OrderType | null;
  if (orderType) {
    return {
      orderType,
      area: getCookie(COOKIE_KEYS.area) ?? undefined,
      tableId: getCookie(COOKIE_KEYS.tableId) ?? undefined,
    };
  }
  return null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const migrationDone = useRef(false);

  const [order, setOrderState] = useState<OrderState>({
    orderType: "",
    isLocationModalOpen: false,
  });

  // ── 1. Load persisted state on mount ──────────────────────────────────────
  useEffect(() => {
    const persisted = loadPersistedOrder();
    if (persisted) {
      setOrderState((prev) => ({
        ...prev,
        ...persisted,
        isLocationModalOpen: false,
      }));
    } else {
      // If user hasn't set location and is on main root / menu, open location modal
      setOrderState((prev) => ({
        ...prev,
        isLocationModalOpen: true,
      }));
    }
  }, []);

  // ── 2. Auto-migrate legacy query params (only once, on any routes) ────────
  useEffect(() => {
    if (migrationDone.current || typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get("type") as OrderType | null;
    const areaParam = searchParams.get("area");
    const tableParam =
      searchParams.get("tableId") ?? searchParams.get("tableid");

    if (!typeParam && !areaParam && !tableParam) return;

    migrationDone.current = true;

    const migrated: OrderState = {
      orderType: typeParam ?? (tableParam ? "dinein" : areaParam ? "delivery" : ""),
      area: areaParam ?? undefined,
      tableId: tableParam ?? undefined,
      isLocationModalOpen: false,
    };

    setOrderState((prev) => ({ ...prev, ...migrated }));
    persistOrder(migrated);

    // Clean the address bar — replace current history entry with clean URL without query string
    const cleanUrl = pathname ?? "/";
    router.replace(cleanUrl);
  }, [pathname, router]);

  // ── 3. Setters ─────────────────────────────────────────────────────────────

  const setOrder = useCallback((newOrder: OrderState) => {
    setOrderState((prev) => {
      const merged = { ...prev, ...newOrder };
      persistOrder(merged);
      return merged;
    });
  }, []);

  const setCheckoutModalOpen = useCallback((isOpen: boolean) => {
    setOrderState((prev) => {
      if (prev.isCheckoutModalOpen === isOpen) return prev;
      return { ...prev, isCheckoutModalOpen: isOpen };
    });
  }, []);

  const setLocationModalOpen = useCallback((isOpen: boolean) => {
    setOrderState((prev) => {
      if (prev.isLocationModalOpen === isOpen) return prev;
      return { ...prev, isLocationModalOpen: isOpen };
    });
  }, []);

  const clearOrder = useCallback(() => {
    setOrderState({ orderType: "", isLocationModalOpen: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem("order-context");
    }
    deleteCookie(COOKIE_KEYS.orderType);
    deleteCookie(COOKIE_KEYS.area);
    deleteCookie(COOKIE_KEYS.tableId);
  }, []);

  // ── 4. Derived state ───────────────────────────────────────────────────────

  const isLocationSet = useMemo(() => {
    if (!order.orderType) return false;
    if (order.orderType === "delivery") return !!order.area;
    if (order.orderType === "dinein") return !!order.tableId;
    return order.orderType === "pickup";
  }, [order]);

  const contextValue = useMemo(
    () => ({
      ...order,
      setOrder,
      clearOrder,
      setCheckoutModalOpen,
      setLocationModalOpen,
      isLocationSet,
    }),
    [order, setOrder, clearOrder, setCheckoutModalOpen, setLocationModalOpen, isLocationSet]
  );

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

const defaultOrderContext: OrderContextValue = {
  orderType: "",
  setOrder: () => {},
  clearOrder: () => {},
  setCheckoutModalOpen: () => {},
  setLocationModalOpen: () => {},
  isLocationSet: false,
};

export function useOrder() {
  const ctx = useContext(OrderContext);
  return ctx || defaultOrderContext;
}
