module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  coveragePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/test/util/"]
};