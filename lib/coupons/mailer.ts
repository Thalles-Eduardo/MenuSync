import { getEnv } from "../env";

export type CupomParaEnvio = {
  email: string;
  code: string;
  expiresAt: Date;
};

export interface EnviadorDeCupom {
  enviar(cupom: CupomParaEnvio): Promise<void>;
}

/**
 * Erro TIPADO de envio.
 *
 * O handler precisa distinguir "o provedor de e-mail falhou" (502, pede nova
 * tentativa; a linha ja esta no banco) de qualquer outra excecao (500). Um
 * `Error` cru obrigaria a inspecionar mensagem, que quebra no primeiro refactor.
 * A `causa` fica so para o log do servidor — nunca vai para a resposta.
 */
export class ErroDeEnvio extends Error {
  readonly causa?: unknown;

  constructor(mensagem: string, causa?: unknown) {
    super(mensagem);
    this.name = "ErroDeEnvio";
    this.causa = causa;
  }
}

/**
 * Reduz um e-mail a `f***@dominio.com`.
 *
 * E-mail e PII e log costuma sair da maquina (agregador, console de deploy,
 * ticket). Guardar o dominio e a primeira letra da o suficiente para correlacionar
 * um incidente sem despejar a base de leads em texto puro.
 */
export function redigirEmail(email: string): string {
  const arroba = email.lastIndexOf("@");
  if (arroba <= 0) return "***";

  const local = email.slice(0, arroba);
  const dominio = email.slice(arroba + 1);
  return `${local[0]}***@${dominio}`;
}

function formatarValidade(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function montarHtml(code: string, validade: string): string {
  // HTML deliberadamente simples e SEM imagem externa: imagem remota em e-mail
  // vira pixel de rastreio aos olhos dos clientes de e-mail e derruba a
  // entregabilidade, alem de quase sempre chegar bloqueada.
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1c1c1c;line-height:1.6">',
    "<p>Oi! Seu cupom do MenuSync chegou.</p>",
    '<p style="font-size:24px;font-weight:bold;letter-spacing:2px">',
    code,
    "</p>",
    "<p>Ele vale <strong>10% de desconto</strong> e e valido ate <strong>",
    validade,
    "</strong>.</p>",
    "<p>E so informar o codigo ao fechar o pedido. Bom apetite!</p>",
    '<p style="font-size:13px;color:#6b6b6b">',
    "Se voce nao pediu este cupom, pode ignorar esta mensagem.",
    "</p>",
    "</div>",
  ].join("");
}

function montarTexto(code: string, validade: string): string {
  return [
    "Oi! Seu cupom do MenuSync chegou.",
    "",
    `Codigo: ${code}`,
    `Valido ate: ${validade}`,
    "",
    "Ele vale 10% de desconto. E so informar o codigo ao fechar o pedido.",
    "",
    "Se voce nao pediu este cupom, pode ignorar esta mensagem.",
  ].join("\n");
}

const ENDPOINT = "https://api.mailersend.com/v1/email";

// Um provedor lento nao pode segurar a requisicao do usuario indefinidamente:
// sem timeout, uma conexao pendurada prende o handler ate o limite da plataforma.
const TIMEOUT_MS = 10_000;

/**
 * Envio via API HTTP da MailerSend (POST /v1/email).
 *
 * Usamos `fetch` direto em vez do SDK: o contrato e um POST JSON simples, e uma
 * dependencia a menos e uma superficie a menos para auditar.
 */
export class EnviadorMailerSend implements EnviadorDeCupom {
  async enviar(cupom: CupomParaEnvio): Promise<void> {
    const env = getEnv();
    const validade = formatarValidade(cupom.expiresAt);

    let resposta: Response;
    try {
      resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: { email: env.COUPON_FROM_EMAIL, name: env.COUPON_FROM_NAME },
          // `to` e um ARRAY de objetos nesta API — string simples e recusada.
          to: [{ email: cupom.email }],
          subject: "Seu cupom de 10% no MenuSync",
          html: montarHtml(cupom.code, validade),
          text: montarTexto(cupom.code, validade),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (erro) {
      // Rede, DNS ou o timeout acima: nada saiu.
      throw new ErroDeEnvio("Falha ao contatar o provedor de e-mail", erro);
    }

    // Sucesso aqui e 202 Accepted com CORPO VAZIO (nao 200 com JSON). Tentar
    // fazer .json() do sucesso lancaria; por isso a checagem e por status.
    if (resposta.status === 202) {
      // NUNCA o e-mail inteiro e NUNCA o codigo: o codigo vale desconto e quem le
      // log nao deveria conseguir resgatar cupom alheio a partir dele. O
      // x-message-id serve para rastrear o envio no painel sem expor nada disso.
      console.info(
        `[coupons] cupom enviado para ${redigirEmail(cupom.email)}` +
          ` (msg: ${resposta.headers.get("x-message-id") ?? "sem id"})`,
      );
      return;
    }

    // Erro: o corpo tem o detalhe (ex.: 422 com "#MS42207" quando o dominio do
    // remetente nao esta verificado). Vai para a `causa`, que so o log ve —
    // nunca a resposta ao cliente.
    const detalhe = await resposta.text().catch(() => "");
    throw new ErroDeEnvio(
      `O provedor de e-mail recusou o envio (HTTP ${resposta.status})`,
      detalhe.slice(0, 500),
    );
  }
}

// Seam de injecao: o handler pede o enviador em vez de instanciar o real direto,
// para a suite de integracao trocar por um stub e nao gastar cota real.
let enviadorAtual: EnviadorDeCupom = new EnviadorMailerSend();

export function obterEnviador(): EnviadorDeCupom {
  return enviadorAtual;
}

export function definirEnviador(enviador: EnviadorDeCupom): void {
  enviadorAtual = enviador;
}
