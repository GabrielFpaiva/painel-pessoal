import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Vazio, carregando e erro em três componentes, usados por toda tela.
 *
 * Existem aqui para não serem reinventados por página — e porque tela vazia é
 * convite para agir, não recado triste.
 */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** O que fazer agora. Estado vazio sem saída é beco sem saída. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
      <h2 className="display text-base font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

/** Esqueleto com a forma do conteúdo que vem, para a tela não pular. */
export function LoadingState({
  rows = 3,
  label,
  className,
}: {
  rows?: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn("flex flex-col gap-2", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg bg-surface-2"
        />
      ))}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  /** Diga o que quebrou e como resolver. Nunca só "erro inesperado". */
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-danger/5 px-6 py-8 text-center"
    >
      <h2 className="display text-base font-semibold text-danger">{title}</h2>
      {description ? (
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
