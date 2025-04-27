import type { Config } from "jest"

const config: Config = {
  collectCoverageFrom: ["src/**"],
  moduleFileExtensions: ["js", "ts", "json", "node"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/$1",
  },
  preset: "ts-jest",
  setupFiles: ["<rootDir>/test/setUp.ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
}

export default config
