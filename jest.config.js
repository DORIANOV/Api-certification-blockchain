module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/test/',
        '/dist/'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    setupFiles: ['./tests/setup.js']
};
