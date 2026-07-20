import { z } from "zod";

const esquema = z.object({
  DATABASE_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  COUPON_FROM_EMAIL: z.string().min(1),
});

export type Env = z.infer<typeof esquema>;

let cache: Env | null = null;

/**
 * Env validado, resolvido na primeira chamada e memorizado.
 *
 * A validacao NAO acontece no escopo do modulo de proposito: o `npm run build`
 * do Next avalia os modulos das rotas, e num ambiente sem .env (CI, imagem de
 * build) isso derrubaria o build inteiro — e o build e um dos nossos portoes de
 * verificacao. Validando na primeira chamada, que so parte de dentro do
 * handler, o fail-fast continua valendo: ele so migra do import para a primeira
 * requisicao.
 */
export function getEnv(): Env {
  if (cache) return cache;

  const resultado = esquema.safeParse(process.env);

  if (!resultado.success) {
    // So os NOMES das chaves entram na mensagem. Os valores sao segredos
    // (chave da Resend, senha do banco) e um erro costuma acabar em log
    // agregado, console de deploy ou ticket de suporte.
    const chaves = [...new Set(resultado.error.issues.map((i) => i.path.join(".")))];
    throw new Error(
      `Variaveis de ambiente invalidas ou ausentes: ${chaves.join(", ")}. ` +
        `Confira o .env.example.`,
    );
  }

  cache = resultado.data;
  return cache;
}
