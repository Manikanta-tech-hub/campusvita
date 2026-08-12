import type { NextConfig } from "next";
/*
const nextConfig: NextConfig = {
  images: {
    domains: [
      "i.pinimg.com",
      "images.unsplash.com",
      "encrypted-tbn0.gstatic.com",
      "mytastycurry.com",
    ],
  },
};
*/
const nextConfig: NextConfig = {
  images: {
    remotePatterns:[
      {
        protocol:'http',
        hostname:'localhost',
        port:'8000',
        pathname: "/uploads/**",
      },
      {
        protocol:'http',
        hostname:'127.0.0.1',
        port:'8000',
        pathname: "/uploads/**",
      },
    ]
  },
};
export default nextConfig;