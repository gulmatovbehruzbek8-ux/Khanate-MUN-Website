/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: true },
      { source: "/assembly", destination: "/en/committees", permanent: true },
      { source: "/council", destination: "/en/committees", permanent: true },
      { source: "/en/assembly", destination: "/en/committees", permanent: true },
      { source: "/en/council", destination: "/en/committees", permanent: true },
      { source: "/uz/assembly", destination: "/uz/committees", permanent: true },
      { source: "/uz/council", destination: "/uz/committees", permanent: true },
    ];
  },
};
export default nextConfig;
