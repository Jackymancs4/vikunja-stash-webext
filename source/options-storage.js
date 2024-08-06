import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		vikunjaApiUrl: 'http://localhost:41184',
		token: '',
		projectId: '',
		entryTemplate: '- [ ] [{title}]({url})',
		removeEmoji: false,
		ignoreSpecialPages: true,
		saveAllWindows: true,
		closeTabsOnceSaved: false,
	},
	migrations: [
		OptionsSync.migrations.removeUnused,
	],
	logging: true,
});

export default optionsStorage;
