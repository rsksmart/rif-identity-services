module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: ['default', 'jest-junit'],
  testResultsProcessor: 'jest-junit',
  testTimeout: 15000
};
