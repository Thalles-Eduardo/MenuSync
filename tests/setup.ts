import "dotenv/config";

/**
 * Trava de seguranca contra envio real.
 *
 * O stub do mailer (definirEnviador) e a primeira barreira, mas ele ja falhou em
 * pegar uma vez nesta base — bastou importar o modulo por um especificador
 * diferente para o cache criar uma segunda instancia, e a rota seguiu chamando a
 * Resend de verdade sem nenhum sinal. Aqui qualquer fetch para o provedor vira
 * erro alto em vez de trafego silencioso gastando cota real.
 */
const fetchOriginal = globalThis.fetch;

globalThis.fetch = ((entrada: Parameters<typeof fetch>[0], ...resto: unknown[]) => {
  const alvo =
    typeof entrada === "string" || entrada instanceof URL
      ? String(entrada)
      : (entrada as Request).url;

  if (alvo.includes("resend.com")) {
    throw new Error(
      "HARNESS FURADO: chamada real ao provedor de e-mail durante os testes. " +
        "O stub de definirEnviador() nao pegou — confira se o teste e a rota " +
        'importam "@/lib/coupons/mailer" pelo mesmo especificador.',
    );
  }

  return fetchOriginal(entrada, ...(resto as [RequestInit?]));
}) as typeof fetch;
