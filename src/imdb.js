/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	const tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.movie';
}

function isShow() {
	const tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.tv_show';
}

function isList() {
	return window.location.pathname.startsWith('/list/');
}

function getImdbId() {
	// const tag = document.querySelector('meta[property="pageId"]');
	const tag = document.querySelector('meta[property="imdb:pageConst"]');
	return tag && tag.content;
}

function cleanYear(year) {
	// The year can contain `()`, so we need to strip it out.
	return parseInt(year.trim().replace(/\(|\)/g, ''));
}

const imdbId = getImdbId();

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
	el.classList.add('ipc-chip--on-baseAlt');
	el.style.display = 'none';
	$parent.appendChild(el);
	return el;
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.replace(/'/g, "\\'");;
}

function initPlexMovie() {
	// const $parent = document.querySelector('.plot_summary');
	const $parent = document.querySelector('.ipc-chip-list__scroller');
	// const $parent = document.querySelector('div[data-testid="genres"]');
	const $button = renderPlexButton($parent);
	if (!$button) {
		return;
	}

	var schema = document.querySelector('script[type="application/ld+json"]').innerText;
	schema = JSON.parse(schema);

	let title = schema.alternateName || schema.name;
	title = decodeHtml(title);
	// const $year = schema.datePublished.split('-')[0];

	const $year = document.querySelector('title').textContent.match(/\(([^)]+)\)/)[1]
	const year = parseInt($year);

	console.log(title, year);

	findPlexMedia({ type: 'movie', title, year, button: $button, imdbId });
}

function initPlexShow() {
	// const $parent = document.querySelector('.plot_summary');
	const $parent = document.querySelector('div[data-testid="genres"]');
	const $button = renderPlexButton($parent);
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.title_wrapper h1');
	const date = document.querySelector('title').textContent;
	const dateMatch = date.match(/Series (\d{4})/);
	if (!$title || !dateMatch) {
		modifyPlexButton($button, 'error', 'Could not extract title or year');
		return;
	}
	const title = $title.textContent.trim();
	const year = parseInt(dateMatch[1]);

	findPlexMedia({ type: 'show', title, year, button: $button, imdbId });
}

function addInListItem(el) {
	const $parent = el.querySelector('.button_strip');
	const $button = renderPlexButton($parent);
	if (!$button) {
		return;
	}
	const $imdbId = el.querySelector('.wlb_lite');
	const $title = el.querySelector('.info b a');
	const $date = el.querySelector('.info .year_type');
	if (!$imdbId || !$title || !$date) {
		modifyPlexButton($button, 'error', 'Could not extract title or year');
		return;
	}
	const type = $date.textContent.includes('TV Series') ? 'show' : 'movie';
	const title = $title.textContent.trim();
	const year = cleanYear($date.textContent);
	const myImdbId = $imdbId.dataset.tconst;

	findPlexMedia({ type, title, year, button: $button, imdbId: myImdbId });
}

function initList() {
	const $listItem = document.querySelectorAll('#main .list_item');

	$listItem.forEach(addInListItem);
}

if (((isMovie() || isShow()) && imdbId) || isList()) {
	parseOptions().then(() => {
		if (isMovie()) {
			initPlexMovie();
		} else if (isShow()) {
			initPlexShow();
		} else {
			initList();
		}
	});
}
