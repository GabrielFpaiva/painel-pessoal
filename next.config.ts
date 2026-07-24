import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  // O badge de dev do Next fica exatamente sobre a bottom nav a 390px, que é o
  // viewport de projeto. Atrapalha o teste e, principalmente, o desenvolvimento.
  devIndicators: false,
  turbopack: {
    // O vault do Obsidian tem outros projetos acima desta pasta; sem fixar a
    // raiz, o Turbopack tenta inferir e escolhe o diretório errado.
    root: path.resolve(import.meta.dirname),
  },
};

export default withNextIntl(nextConfig);
