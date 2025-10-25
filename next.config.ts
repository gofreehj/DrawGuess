import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // React Compiler for better performance
  reactCompiler: true,
  
  // Production optimizations
  compress: isProduction,
  poweredByHeader: false,
  generateEtags: isProduction,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: isProduction ? 3600 : 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: isProduction,
    optimizePackageImports: ['fabric'],
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['better-sqlite3', 'canvas'],
  
  // Turbopack configuration (empty to silence warning)
  turbopack: {},
  
  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    ];

    // Add CSP header in production
    if (isProduction && process.env.CSP_ENABLED === 'true') {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com",
          "frame-ancestors 'none'",
        ].join('; '),
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BUILD_TIME: new Date().toISOString(),
    BUILD_VERSION: process.env.npm_package_version || '0.1.0',
  },
  
  // Output configuration for different deployment targets
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Production-specific webpack optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            fabric: {
              test: /[\\/]node_modules[\\/]fabric[\\/]/,
              name: 'fabric',
              chunks: 'all',
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
      };

      // Add bundle analyzer in production if enabled
      if (process.env.NEXT_BUNDLE_ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analyzer-report.html',
          })
        );
      }
    }
    
    // Handle canvas and better-sqlite3 for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas', 'better-sqlite3');
    }

    // Add performance hints
    config.performance = {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration (removed - no longer supported in next.config)
};

export default nextConfig;
