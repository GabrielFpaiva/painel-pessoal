import {
  Award,
  BookOpen,
  Flame,
  GraduationCap,
  LayoutGrid,
  Library,
  Route as RouteIcon,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

import { GithubMark } from "@/components/icons/github-mark";

/**
 * A navegação do produto em um lugar só: bottom nav, sidebar e ⌘K leem daqui.
 * O ícone vem como componente e não como string — string exigiria um mapa de
 * lookup e mataria a checagem do compilador.
 */
export type NavItem = {
  /** Chave da tradução em `nav.*`. */
  key: string;
  href: Route;
  icon: LucideIcon | typeof GithubMark;
};

/**
 * `newHref` é o contrato com as fases seguintes: a tela abre o formulário de
 * cadastro quando recebe `?novo=1`. Escrito literalmente, e não montado por
 * template, para o compilador conferir a rota.
 */
export type CreatableNavItem = NavItem & { newHref: Route };

/** Quatro abas: é o que cabe no polegar sem virar sopa de ícone. */
export const primaryNav: CreatableNavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    newHref: "/missoes?novo=1",
    icon: LayoutGrid,
  },
  {
    key: "academico",
    href: "/academico",
    newHref: "/academico?novo=1",
    icon: GraduationCap,
  },
  { key: "missoes", href: "/missoes", newHref: "/missoes?novo=1", icon: Flame },
  {
    key: "biblioteca",
    href: "/livros",
    newHref: "/livros?novo=1",
    icon: Library,
  },
];

/** Sai do avatar e do ⌘K, não gasta aba. */
export const secondaryNav: NavItem[] = [
  { key: "certificados", href: "/certificados", icon: Award },
  { key: "cursos", href: "/cursos", icon: BookOpen },
  { key: "roadmap", href: "/roadmap", icon: RouteIcon },
  { key: "github", href: "/github", icon: GithubMark },
  { key: "config", href: "/config", icon: Settings },
];

export const allNav: NavItem[] = [...primaryNav, ...secondaryNav];
