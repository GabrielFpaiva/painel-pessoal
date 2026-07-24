import { redirect } from "next/navigation";

import { BottomNav, Sidebar } from "@/components/app-nav";
import { CommandPalette } from "@/components/command-palette";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

/**
 * Área privada. O middleware já garantiu que existe sessão; aqui garantimos que
 * existe **perfil** — quem autenticou mas não resgatou convite não tem espaço
 * para entrar (ADR-04).
 *
 * A checagem mora aqui, e não no middleware, para não custar uma consulta ao
 * banco a cada request de asset.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/aceitar-convite");

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <span className="tabular text-sm text-muted-foreground">
            @{profile.username}
          </span>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* pb-28 abre espaço para a bottom nav e o FAB no celular. */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
      <CommandPalette />
    </div>
  );
}
