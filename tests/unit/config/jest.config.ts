import path from 'path'
import { compilerOptions } from '../../../vite.config'
const rootDir = path.resolve(__dirname, '../../../')

// We need to transpile these modules as they are using esm syntax
const esmModules = [
  'lodash-es',
  'mark.js',
  'fuse.js',
  'filesize',
  '@kitware\\+vtk.js',
  'd3-array',
  'd3-scale',
  'd3-time',
  'internmap'
].map((m) => `.pnpm/${m}@.*`)
process.env.TZ = 'GMT'
module.exports = {
  globals: {
    'vue-jest': {
      compilerOptions
    }
  },
  rootDir,
  modulePaths: ['<rootDir>'],
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/tests/unit/stubs/empty.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^core-js$': '<rootDir>/node_modules/core-js',
    '^mark.js$': '<rootDir>/node_modules/mark.js/src/vanilla.js',
    '^fuse.js$': '<rootDir>/node_modules/fuse.js/dist/fuse.esm.js',
    '^filesize$': '<rootDir>/node_modules/filesize/lib/filesize.esm.js',

    // dedupe ...
    '^vue$': '<rootDir>/node_modules/vue/dist/vue.cjs.js',
    '^vue3-gettext$': '<rootDir>/node_modules/vue3-gettext/dist/cjs/index.js',

    // HACK: workaround for https://github.com/transloadit/uppy/issues/4127
    '@uppy/core': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/dashboard': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/xhr-upload': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/drop-target': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/tus': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/utils': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/onedrive': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/google-drive': '<rootDir>tests/unit/stubs/uppy',
    '@uppy/webdav': '<rootDir>tests/unit/stubs/uppy'
  },
  modulePathIgnorePatterns: ['packages/design-system/docs/'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esmModules.join('|')})`],
  setupFiles: [
    '<rootDir>/tests/unit/config/jest.init.ts',
    '<rootDir>/tests/unit/config/jest.overrides.ts',
    'core-js'
  ],
  snapshotSerializers: ['jest-serializer-vue-tjw'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['lcov'],
  collectCoverageFrom: [
    '<rootDir>/packages/**/src/**/*.{js,ts,vue}',
    '!<rootDir>/**/node_modules/**'
  ],
  testMatch: ['**/*.spec.{js,ts}'],
  testPathIgnorePatterns: ['<rootDir>/.pnpm-store/*'],
  clearMocks: true
}
