/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // clearMocks: true,
  testMatch: ["**/**/*.test.ts"],
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  forceExit: true,
};
