import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  // The website has its own lockfile inside the app repo: build from here.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};
export default nextConfig;
