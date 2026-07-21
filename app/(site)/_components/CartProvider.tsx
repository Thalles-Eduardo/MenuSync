"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartInput, CartItem } from "../_data/cart";

const STORAGE_KEY = "menusync:cart";
const CUPOM_STORAGE_KEY = "menusync:cupom";

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

export type CupomAplicado = { code: string; percent: number };

/**
 * Le o codigo salvo, e SOMENTE o codigo.
 *
 * O localStorage e editavel por quem estiver com o DevTools aberto. Se o
 * percentual viesse daqui, trocar 10 por 90 no storage mudaria o total da tela.
 * Por isso esta funcao devolve `string`, nunca um objeto com desconto: mesmo que
 * alguem grave {"code":"...","percent":90}, o 90 e descartado aqui e o
 * percentual real vem da resposta do servidor. A protecao e estrutural — nao
 * existe caminho no codigo que leia um percentual do cliente.
 */
function parseCodigoSalvo(raw: string | null): string | null {
  if (!raw) return null;

  let bruto: string = raw;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data === "string") bruto = data;
    else if (data && typeof data === "object" && typeof (data as CupomAplicado).code === "string") {
      bruto = (data as CupomAplicado).code;
    }
  } catch {
    // Nao era JSON: o formato que gravamos e a string crua mesmo.
  }

  const code = bruto.trim().toUpperCase();
  return code.length > 0 && code.length <= 64 ? code : null;
}

/**
 * Extrai o cupom da resposta do servidor — a UNICA origem aceita do percentual.
 *
 * O clamp em 0..100 nao desconfia do nosso proprio backend; ele garante que um
 * percentual fora da faixa (bug de migration, coluna editada a mao) nao produza
 * um total negativo na tela.
 */
function lerCupomDaResposta(dados: unknown): CupomAplicado | null {
  if (!dados || typeof dados !== "object") return null;
  const corpo = dados as { valid?: unknown; code?: unknown; percent?: unknown };

  if (corpo.valid !== true) return null;
  if (typeof corpo.code !== "string" || corpo.code.length === 0) return null;
  if (typeof corpo.percent !== "number" || !Number.isFinite(corpo.percent)) return null;

  return { code: corpo.code, percent: Math.min(100, Math.max(0, corpo.percent)) };
}

/** Mensagem do shape { error: { code, message } } que todas as rotas devolvem. */
function mensagemDeErro(dados: unknown): string {
  const corpo = dados as { error?: { message?: unknown } } | null;
  const mensagem = corpo?.error?.message;
  return typeof mensagem === "string" && mensagem.length > 0
    ? mensagem
    : "Nao foi possivel aplicar o cupom.";
}

/** Centavos nao suportam fracao: arredondamos o total com desconto a 2 casas. */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

type CartValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  desconto: number;
  total: number;
  cupom: CupomAplicado | null;
  aplicandoCupom: boolean;
  erroCupom: string | null;
  /** Valor em reais abatido pelo cupom, derivado do percentual do servidor. */
  descontoCupom: number;
  /** `total` menos o desconto do cupom. E o valor que a UI cobra. */
  totalFinal: number;
  aplicarCupom: (code: string) => Promise<void>;
  removerCupom: () => void;
  /** Consome o cupom no servidor. Devolve false se ele nao valia mais. */
  consumirCupom: () => Promise<boolean>;
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

  const [cupom, setCupom] = useState<CupomAplicado | null>(null);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState<string | null>(null);

  // Hidrata depois da montagem. Ler storage no useState inicial quebraria o SSR
  // (servidor renderiza vazio, cliente renderiza cheio).
  useEffect(() => {
    dispatch({ type: "HYDRATE", items: parseItems(window.localStorage.getItem(STORAGE_KEY)) });
    hydrated.current = true;
  }, []);

  // Revalidacao na hidratacao: o cupom salvo NAO vira desconto na tela por si
  // so. O storage guarda um codigo, e so; o percentual precisa ser buscado no
  // servidor a cada carga da pagina. Enquanto esta requisicao nao volta, `cupom`
  // e null e o total mostrado e o cheio.
  useEffect(() => {
    const code = parseCodigoSalvo(window.localStorage.getItem(CUPOM_STORAGE_KEY));
    if (!code) return;

    // Se a pagina for fechada no meio, o setState nao pode rodar depois do
    // unmount.
    let vivo = true;

    (async () => {
      try {
        const resposta = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!vivo) return;

        if (!resposta.ok) {
          // Limpeza SILENCIOSA: o cupom pode ter expirado ou sido usado entre
          // duas visitas, e o usuario nao pediu nada agora — abrir o carrinho e
          // levar um erro que ele nao provocou seria ruido.
          window.localStorage.removeItem(CUPOM_STORAGE_KEY);
          return;
        }

        const dados: unknown = await resposta.json();
        if (!vivo) return;
        setCupom(lerCupomDaResposta(dados));
      } catch {
        // Rede fora: mantemos o codigo no storage para a proxima carga tentar de
        // novo, mas NAO aplicamos desconto nenhum sem confirmacao do servidor.
        if (vivo) setCupom(null);
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  const aplicarCupom = useCallback(async (codeBruto: string) => {
    const code = codeBruto.trim().toUpperCase();
    if (!code) {
      setErroCupom("Digite o codigo do cupom.");
      return;
    }

    setAplicandoCupom(true);
    setErroCupom(null);

    try {
      const resposta = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const dados: unknown = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setCupom(null);
        window.localStorage.removeItem(CUPOM_STORAGE_KEY);
        setErroCupom(mensagemDeErro(dados));
        return;
      }

      const aplicado = lerCupomDaResposta(dados);
      if (!aplicado) {
        setErroCupom("Nao foi possivel aplicar o cupom. Tente de novo.");
        return;
      }

      setCupom(aplicado);
      // So o codigo vai para o storage. O `percent` fica em memoria e morre com
      // a aba, exatamente para nao existir uma copia editavel dele.
      window.localStorage.setItem(CUPOM_STORAGE_KEY, aplicado.code);
    } catch {
      setErroCupom("Nao foi possivel falar com o servidor. Tente de novo.");
    } finally {
      setAplicandoCupom(false);
    }
  }, []);

  const removerCupom = useCallback(() => {
    setCupom(null);
    setErroCupom(null);
    window.localStorage.removeItem(CUPOM_STORAGE_KEY);
  }, []);

  const consumirCupom = useCallback(async (): Promise<boolean> => {
    if (!cupom) return true; // Sem cupom nao ha o que consumir: o pedido segue.

    try {
      const resposta = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cupom.code }),
      });

      if (!resposta.ok) {
        const dados: unknown = await resposta.json().catch(() => null);
        // O cupom deixou de valer (outra aba o consumiu, ou ele venceu agora).
        // Tiramos o desconto da tela ANTES de devolver false, para o usuario ver
        // o preco real antes de confirmar de novo.
        setCupom(null);
        window.localStorage.removeItem(CUPOM_STORAGE_KEY);
        setErroCupom(mensagemDeErro(dados));
        return false;
      }

      // Consumido: o codigo nao serve mais para nada, sai do storage.
      window.localStorage.removeItem(CUPOM_STORAGE_KEY);
      return true;
    } catch {
      setErroCupom("Nao foi possivel falar com o servidor. Tente de novo.");
      return false;
    }
  }, [cupom]);

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

    // `cupom` so e diferente de null depois que o SERVIDOR confirmou o codigo,
    // entao este calculo nunca usa um percentual vindo do cliente.
    const descontoCupom = cupom ? arredondar((total * cupom.percent) / 100) : 0;

    return {
      items: state.items,
      hydrated: state.hydrated,
      count,
      subtotal,
      total,
      desconto: subtotal - total,
      cupom,
      aplicandoCupom,
      erroCupom,
      descontoCupom,
      totalFinal: arredondar(total - descontoCupom),
      aplicarCupom,
      removerCupom,
      consumirCupom,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (id) => dispatch({ type: "REMOVE", id }),
      setQty: (id, quantity) => dispatch({ type: "SET_QTY", id, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [
    state.items,
    state.hydrated,
    cupom,
    aplicandoCupom,
    erroCupom,
    aplicarCupom,
    removerCupom,
    consumirCupom,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
