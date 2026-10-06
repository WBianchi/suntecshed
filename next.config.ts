import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  // O output file tracing não pega o binário nativo do libvips usado pelo
  // sharp — sem isso o upload quebra em produção com ERR_DLOPEN_FAILED
  // mesmo funcionando local. node_modules/sharp agora é diretório real
  // (node-linker=hoisted no .npmrc), não symlink, então dá pra incluir
  // direto sem cair no erro de "invalid deployment package" da Vercel.
  outputFileTracingIncludes: {
    "/api/admin/upload": ["./node_modules/sharp/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
