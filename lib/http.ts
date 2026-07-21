/**
 * Identifica o cliente para fins de rate limit.
 *
 * `x-forwarded-for` e forjavel se nenhum proxy confiavel o reescrever (ver as
 * limitacoes em lib/rate-limit.ts). Em dev costuma vir nulo; nesse caso todo
 * mundo cai num bucket unico, que e restritivo demais para producao mas seguro
 * aqui: o pior caso e limitar quem nao deveria, nunca liberar quem deveria ser
 * limitado.
 *
 * Vive num modulo proprio porque agora tres rotas precisam exatamente da mesma
 * regra — e uma copia divergente numa delas seria um furo silencioso no limite.
 */
export function identificarCliente(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  if (!encaminhado) return "sem-ip";

  const primeiro = encaminhado.split(",")[0]?.trim();
  return primeiro && primeiro.length > 0 ? primeiro : "sem-ip";
}
