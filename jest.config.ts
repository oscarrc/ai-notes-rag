import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})
 
// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Set up custom test paths and configurations
  testMatch: [
    "**/__tests__/**/*.test.ts?(x)"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/__tests__/utils/setup.ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/"
  ],
  moduleNameMapper: {
    "^@/app/(.*)$": "<rootDir>/app/$1"
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!app/**/*.d.ts",
    "!**/node_modules/**"
  ]
}
 
export default createJestConfig(config)