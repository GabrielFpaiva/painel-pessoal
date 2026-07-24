/**
 * Acesso a variável de ambiente em um lugar só, com falha alta e explícita.
 *
 * `NEXT_PUBLIC_*` vai para o bundle do client por definição — só entram aqui a
 * URL e a chave anon, que são públicas por design (quem protege é a RLS).
 * A service role tem função própria, em `env.server.ts`, que nunca é importada
 * por código de client.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Copie .env.local.example para .env.local.`,
    );
  }
  return value;
}

export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
