/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
   testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/fixtures/'
  ],
//   setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
