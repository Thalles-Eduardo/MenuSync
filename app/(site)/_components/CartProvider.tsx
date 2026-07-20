"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { CartInput, CartItem } from "../_data/cart";

const STORAGE_KEY = "menusync:cart";

type CartState = { items: CartItem[]; hydrated: boolean };

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartInput }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; quantity: number }
  | { type: "CLEAR" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };

    case "ADD": {
      const existe = state.items.some((i) => i.id === action.item.id);
      // Item repetido incrementa a quantidade em vez de duplicar a linha.
      if (existe) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }

    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "SET_QTY":
      // Zerar a quantidade remove a linha (o "−" no 1 apaga o item).
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i,
        ),
      };

    case "CLEAR":
      return { ...state, items: [] };
  }
}

/** Storage é entrada não confiável: formato pode mudar entre versões. */
function parseItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (i): i is CartItem =>
        !!i &&
        typeof i === "object" &&
        typeof (i as CartItem).id === "string" &&
        typeof (i as CartItem).unitPrice === "number" &&
        typeof (i as CartItem).quantity === "number" &&
        (i as CartItem).quantity > 0,
    );
  } catch {
    return [];
  }
}

type CartValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  desconto: number;
  total: number;
  add: (item: CartInput) => void;
  remove: (id: string) => void;
  setQty: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const hydrated = useRef(false);

  // Hidrata depois da montagem. Ler storage no useState inicial quebraria o SSR
  // (servidor renderiza vazio, cliente renderiza cheio).
  useEffect(() => {
    dispatch({ type: "HYDRATE", items: parseItems(window.localStorage.getItem(STORAGE_KEY)) });
    hydrated.current = true;
  }, []);

  // Só grava DEPOIS de hidratar — senão o primeiro render sobrescreve o
  // carrinho salvo com [].
  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const value = useMemo<CartValue>(() => {
    const count = state.items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = state.items.reduce((n, i) => n + i.precoOriginal * i.quantity, 0);
    const total = state.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

    return {
      items: state.items,
      hydrated: state.hydrated,
      count,
      subtotal,
      total,
      desconto: subtotal - total,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (id) => dispatch({ type: "REMOVE", id }),
      setQty: (id, quantity) => dispatch({ type: "SET_QTY", id, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.items, state.hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
