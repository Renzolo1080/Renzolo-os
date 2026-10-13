/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // The 60-second quiz was folded into the free Readiness Snapshot.
    return [{ source: "/quiz", destination: "/snapshot", permanent: false }];
  },
};
export default nextConfig;
