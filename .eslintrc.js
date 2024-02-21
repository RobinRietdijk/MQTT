export default {
	root: true,
	// This tells ESLint to load the config from the package `eslint-config-custom`
	extends: ['@repo/eslint-config/index.js'],
	settings: {
		next: {
			rootDir: ['apps/*/'],
		},
	},
};
