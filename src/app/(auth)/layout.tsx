import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/** Telas sem sessão: uma coluna centrada, nada de navegação. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-end gap-1 px-4 py-3">
        <LocaleSwitcher />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 pb-16">
        {children}
      </main>
    </div>
  );
}
