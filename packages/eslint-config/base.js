const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'prettier',
		'eslint-config-turbo',
		'plugin:@typescript-eslint/recommended',
	],
	plugins: ['only-warn'],
	env: {
		node: true,
	},
	settings: {
		'import/resolver': {
			typescript: {
				project,
			},
		},
	},
	ignorePatterns: [
		// Ignore dotfiles
		'.*.js',
		'*.config.js',
		'node_modules/',
		'dist/',
		'coverage/',
	],
	overrides: [
		{
			files: ['*.js?(x)', '*.ts?(x)'],
		},
	],
};
