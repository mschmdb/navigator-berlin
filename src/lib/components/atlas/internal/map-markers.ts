export function createPlexMarker(): HTMLDivElement {
	const el = document.createElement('div');
	el.className = 'plex-marker';
	el.setAttribute('aria-hidden', 'true');
	el.style.width = '12px';
	el.style.height = '12px';
	el.style.background = '#2A3F7C';
	el.style.borderRadius = '50%';
	el.style.border = '2px solid #ECEAE0';
	return el;
}
