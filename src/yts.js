/* global findPlexMedia, parseOptions, modifyPlexButton */
function areMovies() {
	const tag = document.querySelector('.browse-movie-wrap');
	return tag || false;
}

function isMovie() {
	const tag = document.querySelector('#movie-info');
	return tag || false;
}

function renderPlexButton($parent) {
	if (!$parent) {
		console.log('[WTP] Could not add Plex button.');
		return null;
	}
	const $existingEl = document.querySelector('a.web-to-plex-button');
	if ($existingEl) {
		$existingEl.remove();
	}
	const el = document.createElement('a');
	el.classList.add('web-to-plex-button');
	el.classList.add('ipc-chip');
	el.style.display = 'none';
	$parent.appendChild(el);
	return el;
}


function initPlexMovie() {
	if(areMovies()) {
		document.querySelectorAll('.browse-movie-wrap').forEach((item, i) => {
			let titleEl = item.querySelector('.browse-movie-title'),
				child = titleEl.firstChild,
				title = [];

			while(child) {
				if(child.nodeType === 3) {
					title.push(child.data);
				}

				child = child.nextSibling;
			}
			title = title.join('').trim();

			let	year = parseInt(item.querySelector('.browse-movie-year').textContent.trim().substr(0, 4));

			let button = document.createElement('a');
			button.classList.add('web-to-plex-button')
			button.style.display = 'none';

			item.appendChild(button);

			findPlexMedia({type: 'movie', title, year, button: button});
		});

	} else if(isMovie()) {
		console.log('movie');
	}
}

if(areMovies() || isMovie()) {
	initPlexMovie();
	// parseOptions().then(() => {
	// 	if(areMovies()) {
	// 	} else if(isMovie()) {
	// 		initPlexMovie();
	// 	}
	// });
}
