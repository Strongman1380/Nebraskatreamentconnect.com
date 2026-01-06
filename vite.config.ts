import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Root directory for HTML files
  root: '.',

  // Public directory for static assets (not processed by Vite)
  publicDir: 'public',

  // Build output configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Multi-page application configuration
    rollupOptions: {
      input: {
        // Main public pages
        main: resolve(__dirname, 'index.html'),
        detox: resolve(__dirname, 'detox.html'),
        halfwayHouses: resolve(__dirname, 'halfway-houses.html'),
        outpatient: resolve(__dirname, 'outpatient.html'),

        // Provider portal pages
        providerDashboard: resolve(__dirname, 'provider-dashboard.html'),
        providerSignin: resolve(__dirname, 'provider-signin.html'),
        providerSignup: resolve(__dirname, 'provider-signup.html'),

        // Legal/utility pages
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        notFound: resolve(__dirname, '404.html'),
      },
      output: {
        // Organize output files
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.css$/.test(name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging in production
        drop_debugger: true,
      },
    },

    // Generate source maps for debugging
    sourcemap: true,

    // Chunk size warning threshold (in KB)
    chunkSizeWarningLimit: 500,
  },

  // Development server configuration
  server: {
    port: 5173,
    open: true,
    cors: true,

    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },

    // Watch for changes in these files
    watch: {
      usePolling: false,
    },
  },

  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    open: true,
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@scripts': resolve(__dirname, 'src/scripts'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env['npm_package_version'] || '1.0.0'),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      // Add any npm packages that need pre-bundling
    ],
    exclude: [
      // Firebase is loaded from CDN, not bundled
    ],
  },

  // Plugins
  plugins: [
    // PWA plugin for service worker
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt'],

      manifest: {
        name: 'Nebraska Treatment Connect',
        short_name: 'NE Treatment',
        description: 'Find substance abuse treatment facilities in Nebraska',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Cache strategies
        runtimeCaching: [
          // HTML pages - Network First
          {
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 3,
            },
          },
          // CSS and JS - Cache First (fingerprinted)
          {
            urlPattern: /\.(?:css|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Images - Cache First
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Fonts - Cache First
          {
            urlPattern: /\.(?:woff2?|eot|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // API calls - Network First with fallback
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 5,
            },
          },
          // Static data file - Stale While Revalidate
          {
            urlPattern: /static-data\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-data-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          // Google Fonts - Cache First
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Font Awesome - Cache First
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-awesome-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],

        // Don't cache these
        navigateFallbackDenylist: [/\/api\//],

        // Clean old caches
        cleanupOutdatedCaches: true,

        // Skip waiting to activate new SW immediately
        skipWaiting: true,

        // Take control of pages immediately
        clientsClaim: true,
      },

      devOptions: {
        enabled: false, // Disable in development
      },
    }),
  ],

  // esbuild configuration for TypeScript
  esbuild: {
    // Keep function names for debugging
    keepNames: true,
  },
});
