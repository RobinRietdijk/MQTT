const { resolve } = require('node:path');
const { pathsToModuleNameMapper } = require('ts-jest');

const project = resolve(process.cwd(), 'tsconfig.json');
const { compilerOptions } = require(project);

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
		prefix: '<rootDir>/',
	}),
};
