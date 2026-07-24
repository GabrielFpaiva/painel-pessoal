"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Sem estado de "montado": o tema real só é conhecido depois da hidratação, e
 * guardar isso em state custa um effect que dispara re-render em cascata. Os
 * dois ícones ficam no DOM e o `.dark` do <html> escolhe qual aparece — o
 * servidor e o cliente pintam a mesma marcação.
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={t("toggle")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
}
