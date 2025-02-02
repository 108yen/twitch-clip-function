/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "ts", "json", "node"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/$1",
  },
  preset: "ts-jest",
  setupFiles: ["<rootDir>/test/setUp.ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
}
