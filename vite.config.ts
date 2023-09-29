import { defineConfig, PluginOption, UserConfig, ViteDevServer } from 'vite'
import { mergeConfig, searchForWorkspaceRoot } from 'vite'
import vue from '@vitejs/plugin-vue'
import EnvironmentPlugin from 'vite-plugin-environment'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs'
import visualizer from 'rollup-plugin-visualizer'
import compression from 'rollup-plugin-gzip'
import history from 'connect-history-api-fallback'

import ejs from 'ejs'
import { basename, join } from 'path'
import { existsSync, readdirSync, readFileSync } from 'fs'

// build config
import packageJson from './package.json'
import { getUserAgentRegExp } from 'browserslist-useragent-regexp'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { CompilerOptions } from '@vue/compiler-sfc'
import fetch from 'node-fetch'
import { Agent } from 'https'

// ignoredPackages specifies which packages should be explicitly ignored and thus not be transpiled
const ignoredPackages = ['web-app-skeleton']

export const compilerOptions: CompilerOptions = {
  whitespace: 'preserve'
}

const buildConfig = {
  requirejs: {},
  cdn: process.env.CDN === 'true',
  documentation_url: process.env.DOCUMENTATION_URL,
  ...(process.env.REQUIRE_TIMEOUT && {
    requirejs: { waitSeconds: parseInt(process.env.REQUIRE_TIMEOUT) }
  })
}

const projectRootDir = searchForWorkspaceRoot(process.cwd())
const { version } = packageJson
const supportedBrowsersRegex = getUserAgentRegExp({ allowHigherVersions: true })

const stripScssMarker = '/* STYLES STRIP IMPORTS MARKER */'

// determine inputs
const input = readdirSync('packages').reduce(
  (acc, i) => {
    if (!i.startsWith('web-app') || ignoredPackages.includes(i)) {
      return acc
    }
    for (const extension of ['js', 'ts']) {
      const root = join('packages', i, 'src', `index.${extension}`)
      if (existsSync(root)) {
        acc[i] = root
        break
      }
    }
    return acc
  },
  {
    'index.html': 'index.html',
    'oidc-silent-redirect.html': 'oidc-silent-redirect.html',
    'oidc-callback.html': 'oidc-callback.html'
  }
)

const getJson = async (url: string) => {
  return (
    await fetch(url, {
      ...(url.startsWith('https:') && {
        agent: new Agent({ rejectUnauthorized: false })
      })
    })
  ).json()
}

const getConfigJson = async (url: string, config: UserConfig) => {
  const configJson = await getJson(url)

  // enable previews and enable lazy resources, which are disabled for fast tests
  configJson.options.disablePreviews = false
  configJson.options.displayResourcesLazy = true

  // oC 10
  if (configJson.auth) {
    configJson.auth.clientId =
      process.env.OWNCLOUD_WEB_CLIENT_ID ||
      'AWhZZsxb59ouGg97HsdR7GiN8pnzEYvk1cL6aVJgTQH1Gcdxly1gendLVTZ5zpYC'

    configJson.auth.clientSecret = process.env.OWNCLOUD_WEB_CLIENT_SECRET || undefined
  }

  return configJson
}

export const historyModePlugins = () =>
  [
    {
      name: 'base-href',
      transformIndexHtml: {
        transform() {
          return [
            {
              injectTo: 'head-prepend',
              tag: 'base',
              attrs: {
                href: '/'
              }
            }
          ]
        }
      }
    },
    {
      name: 'fallback-to-index-html',
      configureServer(server: ViteDevServer) {
        return () => {
          const handler = history({
            disableDotRule: true,
            rewrites: [
              {
                from: /$/,
                to({ parsedUrl, request }) {
                  const root = projectRootDir
                  const decodedPath = decodeURIComponent(parsedUrl.pathname)
                  const rewritten = decodedPath + 'index.html'
                  if (decodedPath !== '/' && existsSync(join(root, decodedPath))) {
                    return decodedPath
                  }
                  if (existsSync(join(root, rewritten))) {
                    return rewritten
                  }
                  return `/index.html`
                }
              }
            ]
          })

          server.middlewares.use(handler)
        }
      }
    }
  ] as const

export default defineConfig(async ({ mode, command }) => {
  const production = mode === 'production'
  let config: UserConfig

  /**
    When setting `OWNCLOUD_WEB_CONFIG_URL` make sure to configure the oauth/oidc client


    # oCIS
    For oCIS instances you can use `./dev/docker/ocis.idp.config.yaml`.
    In docker setups you need to mount it to `/etc/ocis/idp.yaml`.
    E.g. with docker-compose you could add a volume to the ocis container like this:
    - /home/youruser/projects/oc-web/dev/docker/ocis.idp.config.yaml:/etc/ocis/idp.yaml

    To use the oCIS deployment examples start vite like this:
    OWNCLOUD_WEB_CONFIG_URL="https://ocis.owncloud.test/config.json" pnpm vite

   */
  const configUrl =
    process.env.OWNCLOUD_WEB_CONFIG_URL || 'https://host.docker.internal:9200/config.json'

  let proxiedServerUrl
  if (command === 'serve') {
    // determine server url
    const configJson = await getJson(configUrl)
    proxiedServerUrl = configJson.server
  }

  config = {
    ...(!production && {
      server: {
        port: 9201,
        https: {
          key: readFileSync('./dev/docker/traefik/certificates/server.key'),
          cert: readFileSync('./dev/docker/traefik/certificates/server.crt')
        }
      }
    })
  }

  return mergeConfig(
    {
      base: '',
      publicDir: 'packages/web-container',
      build: {
        // TODO: Vue3: We currently cannot inline styles of components because @vite/plugin-vue2 does not support it
        // c.f. https://github.com/vitejs/vite-plugin-vue2/issues/18
        // That's why we need to put all styles of our monorepo apps into a monolithic css file for now
        // Once the above issue is resolved or we switch to @vitejs/plugin-vue, we can remove the `cssCodeSplit` setting here
        cssCodeSplit: false,
        rollupOptions: {
          preserveEntrySignatures: 'strict',
          input,
          output: {
            dir: 'dist',
            chunkFileNames: join('js', 'chunks', '[name]-[hash].mjs'),
            entryFileNames: join('js', '[name]-[hash].mjs'),
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                return 'vendor'
              }
            }
          }
        },
        target: browserslistToEsbuild()
      },
      server: {
        host: 'host.docker.internal',
        strictPort: true
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@import "${projectRootDir}/packages/design-system/src/styles/styles";${stripScssMarker}`
          }
        }
      },
      resolve: {
        dedupe: ['vue3-gettext'],
        alias: {
          crypto: join(projectRootDir, 'polyfills/crypto.js'),
          buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
          path: 'rollup-plugin-node-polyfills/polyfills/path',

          // owncloud-sdk // sax
          stream: 'rollup-plugin-node-polyfills/polyfills/stream',
          util: 'rollup-plugin-node-polyfills/polyfills/util',
          string_decoder: 'rollup-plugin-node-polyfills/polyfills/string-decoder',
          process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
          events: 'rollup-plugin-node-polyfills/polyfills/events'
        }
      },
      plugins: [
        // We need to "undefine" `define` which is set by requirejs loaded in index.html
        treatAsCommonjs() as any as PluginOption, // treatAsCommonjs currently returns a Plugin_2 instance

        // In order to avoid multiple definitions of the global styles we import via additionalData into every component
        // we also insert a marker, so we can remove the global definitions after processing.
        // The downside of this approach is that @extend does not work because it modifies the global styles, thus we emit
        // a warning if `@extend` is used in the code base.
        {
          name: '@ownclouders/vite-plugin-strip-css',
          transform(src: string, id) {
            if (id.endsWith('.vue') && !id.includes('node_modules') && src.includes('@extend')) {
              console.warn(
                'You are using @extend in your component. This is likely not working in your styles. Please use mixins instead.',
                id.replace(`${projectRootDir}/`, '')
              )
            }
            if (id.includes('lang.scss')) {
              const split = src.split(stripScssMarker)
              const newSrc = split[split.length - 1]

              return {
                code: newSrc,
                map: null
              }
            }
          }
        },
        EnvironmentPlugin({
          PACKAGE_VERSION: version
        }),
        vue({
          template: {
            compilerOptions
          }
        }),
        viteStaticCopy({
          targets: (() => {
            const targets = [
              ...['fonts', 'icons'].map((name) => ({
                src: `packages/design-system/src/assets/${name}/*`,
                dest: `${name}`
              })),
              {
                src: `./packages/web-runtime/themes/*`,
                dest: `themes`
              },
              {
                src: 'node_modules/requirejs/require.js',
                dest: 'js'
              }
            ]

            return targets
          })()
        }),
        {
          name: '@ownclouders/vite-plugin-runtime-config',
          configureServer(server: ViteDevServer) {
            server.middlewares.use(async (request, response, next) => {
              if (request.url === '/config.json') {
                response.statusCode = 200
                response.setHeader('Content-Type', 'application/json')
                response.end(JSON.stringify(await getConfigJson(configUrl, config)))
                return
              }
              next()
            })
          }
        },
        {
          name: '@ownclouders/vite-plugin-docs',
          transform(src, id) {
            if (id.includes('type=docs')) {
              return {
                code: 'export default {}',
                map: null
              }
            }
          }
        },
        {
          name: 'ejs',
          transformIndexHtml: {
            enforce: 'pre',
            transform(html, { filename }) {
              if (basename(filename) !== 'index.html') {
                return
              }
              return ejs.render(html, {
                data: {
                  buildConfig,

                  title: process.env.TITLE || 'ownCloud',
                  compilationTimestamp: new Date().getTime(),
                  supportedBrowsersRegex: supportedBrowsersRegex
                }
              })
            }
          }
        },
        {
          name: 'import-map',
          transformIndexHtml: {
            transform(html, { bundle, filename }) {
              if (basename(filename) !== 'index.html') {
                return
              }

              // Build an import map for loading internal (as in: shipped and built within this mono repo) apps
              let moduleNames: string[]
              let re: RegExp
              let buildModulePath: any
              if (bundle) {
                moduleNames = Object.keys(bundle)
                // We are in production mode here and need to provide paths relative to the module that contains the import, i.e. web-runtime-*.mjs
                // so it works when oC Web is hosted in a sub folder, e.g. when using the oC 10 integration app
                // The regexp here needs to match the filenames defined in `build.rollupOptions.entryFileNames`
                re = new RegExp(/js\/(web-app-.*)-.*\.(.+)/)
                buildModulePath = (moduleName) => moduleName.replace('js/', './')
              } else {
                // We are in development mode here, so we can just use absolute module paths
                moduleNames = Object.keys(input)
                re = new RegExp(/(web-app-.*)/)
                buildModulePath = (moduleName) => `/packages/${moduleName}/src/index`
              }

              const map = Object.fromEntries(
                moduleNames
                  .map((m) => {
                    const appName = re.exec(m)?.[1]
                    if (appName) {
                      return [appName, buildModulePath(m)]
                    }
                  })
                  .filter(Boolean)
              )
              return [
                {
                  tag: 'script',
                  children: `window.WEB_APPS_MAP = ${JSON.stringify(map)}`
                }
              ]
            }
          }
        },
        ...(command === 'serve' ? historyModePlugins() : []),
        compression(),
        process.env.REPORT !== 'true'
          ? null
          : visualizer({
              filename: join('dist', 'report.html')
            })
      ]
    },
    config
  )
})
