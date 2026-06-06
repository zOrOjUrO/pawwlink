import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @xenova/transformers ships ONNX runtime + wasm; keep it out of the bundle
  // so it runs as a native Node dependency in API routes / server actions.
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;
