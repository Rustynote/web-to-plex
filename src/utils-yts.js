/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
	if (check()) {
		then();
	} else {
		setTimeout(() => wait(check, then), 50);
	}
}

function getPlexMediaRequest({ button, ...mediaOptions }) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{
				type: 'SEARCH_PLEX',
				options: mediaOptions,
				serverConfig: config.server,
			},
			res => {
				if (res.err) {
					reject(res.err);
				}
				resolve(res);
			}
		);
	});
}

function _getOptions() {
	const storage = chrome.storage.sync || chrome.storage.local;

	return new Promise((resolve, reject) => {
		function handleOptions(items) {
			if (!items.plexToken || !items.servers) {
				reject(new Error('Unset options.'));
				return;
			}

			// For now we support only one Plex server, but the options already
			// allow multiple for easy migration in the future.
			const server = items.servers[0];
			const options = {
				server: {
					...server,
					// Compatibility for users who have not updated their settings yet.
					connections: server.connections || [{ uri: server.url }],
				},
			};
			if (items.couchpotatoBasicAuthUsername) {
				options.couchpotatoBasicAuth = {
					username: items.couchpotatoBasicAuthUsername,
					password: items.couchpotatoBasicAuthPassword,
				};
			}
			// TODO: stupid copy/pasta
			if (items.radarrBasicAuthUsername) {
				options.radarrBasicAuth = {
					username: items.radarrBasicAuthUsername,
					password: items.radarrBasicAuthPassword,
				};
			}
			if (items.couchpotatoUrlRoot && items.couchpotatoToken) {
				options.couchpotatoUrl = `${
					items.couchpotatoUrlRoot
				}/api/${encodeURIComponent(items.couchpotatoToken)}`;
			}
			if (items.radarrUrlRoot && items.radarrToken) {
				options.radarrUrl = items.radarrUrlRoot;
				options.radarrToken = items.radarrToken;
			}
			options.radarrStoragePath = items.radarrStoragePath;
			options.radarrQualityProfileId = items.radarrQualityProfileId;

			resolve(options);
		}
		storage.get(null, items => {
			if (chrome.runtime.lastError) {
				chrome.storage.local.get(null, handleOptions);
			} else {
				handleOptions(items);
			}
		});
	});
}

function openOptionsPage() {
	chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
}

let config = null;
function parseOptions() {
	return _getOptions().then(
		options => {
			config = options;
		},
		err => {
			showNotification(
				'warning',
				'Not all options for the Web to Plex extension are filled in.',
				15000,
				openOptionsPage
			);
			throw err;
		}
	);
}

function getPlexMediaUrl(plexMachineId, key) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details?key=${encodeURIComponent(
		key
	)}`;
}

function modifyPlexButton(el, action, title, options) {
	if(action === 'found') {
		el.style.removeProperty('display');
		el.href = getPlexMediaUrl(config.server.id, options.key);
		el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>';
		el.classList.add('web-to-plex-button--found');
	}
	if(action === 'notfound' || action === 'error') {
		el.remove();
		el.textContent = action === 'notfound' ? 'Not on Plex' : 'Plex error';
		el.classList.remove('web-to-plex-button--found');
	}

	if(title) {
		el.title = title;
	}
}

function findPlexMedia(options) {
	if(!config) {
		_getOptions().then(option => {
			config = option;
			console.log(options);
			findPlexMedia(options);
		});
	} else {
		getPlexMediaRequest(options)
		.then(({ found, key }) => {
			if (found) {
				modifyPlexButton(options.button, 'found', 'Found on Plex', { key });
			} else {
				options.field = 'original_title';
				return getPlexMediaRequest(options).then(({ found, key }) => {
					if (found) {
						modifyPlexButton(options.button, 'found', 'Found on Plex', key);
					} else {
						const showDownloader =
						(config.couchpotatoUrl || config.radarrUrl) &&
						options.type !== 'show';
						const action = showDownloader ? 'downloader' : 'notfound';
						const title = showDownloader
						? 'Could not find, want to download?'
						: 'Could not find on Plex';
						modifyPlexButton(options.button, action, title, options);
					}
				});
			}
		})
		.catch(err => {
			modifyPlexButton(
				options.button,
				'error',
				'Request to your Plex Media Server failed.'
			);
			console.error('Request to Plex failed', err);
		});
	}
}
