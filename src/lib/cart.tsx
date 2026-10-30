import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Restaurant } from "./types";

export type CartItem = { key: string; mealId: string; mealName: string; restaurant: Restaurant; qty: number };

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (i: Omit<CartItem, "key" | "qty">) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const STORAGE = "kulasmart-cart";
export const DELIVERY_FEE = 2.99;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items, ready]);

  const add: Ctx["add"] = (i) => {
    const key = `${i.mealId}:${i.restaurant.name}`;
    setItems((cur) => {
      const ex = cur.find((c) => c.key === key);
      return ex ? cur.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)) : [...cur, { ...i, key, qty: 1 }];
    });
  };
  const setQty = (key: string, qty: number) =>
    setItems((cur) => (qty <= 0 ? cur.filter((c) => c.key !== key) : cur.map((c) => (c.key === key ? { ...c, qty } : c))));

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.reduce((s, i) => s + i.qty, 0),
        subtotal: items.reduce((s, i) => s + i.qty * i.restaurant.price, 0),
        add,
        setQty,
        clear: () => setItems([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
