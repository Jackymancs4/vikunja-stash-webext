
// Don't forget to import this wherever you use it
import browser from 'webextension-polyfill';

// eslint-disable-next-line import/no-unassigned-import
import './options-storage.js';

import optionsStorage from './options-storage';

/**
 *
 * @param apiBaseUrl
 * @returns
 */
async function isApiOnline(apiBaseUrl: string, token: string) {
	let response: Response;

	try {
		response = await fetch(`${apiBaseUrl}/projects`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
			},
		});
	} catch {
		return false;
	}

	if (response) {
		return true;
	}

	return false;
}

/**
 *
 * @param apiBaseUrl
 * @param token
 * @param content
 */
async function sendNote(apiBaseUrl: string, token: string, content: Record<string, unknown>) {
	let response: Response;

	response = await fetch(`${apiBaseUrl}/notes?token=${encodeURIComponent(token)}`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(content),
	});

	if (response && response.ok) {
		return true;
	}

	return false;
}

function buildProject(title: string): object {
	return {}
}

function buildTask(title: string, url: string, projectId: string): object {
	return {}
}

/**
 *
 * @param tabList
 * @param parentId
 * @returns
 */
function processTabs(tabList: browser.Tabs.Tab[], parentId: string, template: string, removeEmoji: boolean, ignoreSpecialPages: boolean): Record<string, unknown> {

	let firstEntryText = "";
	let lastEntryText = "";
	let lastWindowId = -1;

	let projects : object[] = [];
	let tasks : object[]= [];

	for (const tab of tabList) {
		if (!tab.url) {
			continue;
		}

		if (ignoreSpecialPages && isSpecialPage(tab.url)) {
			continue;
		}

		let entryText = tab.title ?? tab.url;
		entryText = removeEmoji ? removeEmojiFromString(entryText) : entryText;
		entryText = entryText.trim();

		if(firstEntryText == "") {
			firstEntryText = entryText;
		}

		lastEntryText = entryText;

		if(tab.windowId && lastWindowId != tab.windowId) {
			lastWindowId = tab.windowId

			projects.push(buildProject(entryText))
		}

		tasks.push(buildTask(entryText, tab.url, ""));
	}

	return {
		projects: projects,
		tasks: tasks,
	};
}

/**
 *
 * @param url
 * @returns
 */
function isSpecialPage(url: string): boolean {
	if (url.startsWith('about')) {
		return true;
	}

	if (url.startsWith('chrome')) {
		return true;
	}

	if (url.startsWith('moz-extension')) {
		return true;
	}

	return false;
}

/**
 * https://stackoverflow.com/a/41543705
 *
 * @param text text from which remove the emojis
 * @returns
 */
function removeEmojiFromString(text: string): string {
	return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
}

/**
 * Apply the template to the tab entry. Replace placeholder {title} and {url}
 * with their respective content. Append a new line char in the end.
 *
 * @param entryText title of the tab
 * @param entryUrl url of the tab
 * @param template template to be appliest
 *
 * @returns the final row
 */
function formatEntry(entryText: string, entryUrl: string, template: string): string {
	const now = (new Date()).toLocaleString();
	const result = template
		.replace('{title}', entryText)
		.replace('{url}', entryUrl)
		.replace('{date}', now);

	return result + '\n';
}

/**
 * Apply the template to the tab entry. Replace placeholder {title} and {url}
 * with their respective content. Append a new line char in the end.
 *
 * @param sectionName title of the tab
 *
 * @returns the final row
 */
function formatSection(sectionName: string, template: string): string {
	const now = (new Date()).toLocaleString();

	const result = template
		.replace('{title}', sectionName)
		.replace('{date}', now);

	return result + '\n';
}

function formatNoteTitle(noteTitle: string, template: string): string {
	const now = (new Date()).toLocaleString();

	const result = template
		.replace('{title}', noteTitle)
		.replace('{date}', now);

	return result;
}

browser.action.onClicked.addListener(async () => {
	const options = await optionsStorage.getAll();

	const token = options.token;

	// Vikunja token is mandatory
	if (!token) {
		browser.notifications.create({
			type: 'basic',
			title: 'Vikunja Tab Stash',
			message: 'Empty authentication token',
		});

		return;
	}

	const tabQueryOption: browser.Tabs.QueryQueryInfoType = {};

	if (!options.saveAllWindows) {

		// Get a list of all tabs in the current window
		tabQueryOption.currentWindow = true
	}

	const tabList = await browser.tabs.query(tabQueryOption);
	const tabListIds = tabList.map((tab) => {return tab.id ?? 0});

	// const taskObject = createNote(tabList, options.notebookId, options.entryTemplate, options.removeEmoji, options.ignoreSpecialPages);

	if (await isApiOnline(options.vikunjaApiUrl, token)) {
		// const result = await sendNote(options.joplinApiUrl, token, noteContent);

        const result = false;

		if (result) {
			browser.notifications.create({
				type: 'basic',
				title: 'Vikunja Tab Stash',
				message: 'Window stashed',
			});

			browser.tabs.remove(tabListIds)

		} else {
			browser.notifications.create({
				type: 'basic',
				title: 'Vikunja Tab Stash',
				message: 'Error stashing',
			});
		}
	} else {
		browser.notifications.create({
			type: 'basic',
			title: 'Vikunja Tab Stash',
			message: 'Cannot connect to Vikunja',
		});
	}
});
