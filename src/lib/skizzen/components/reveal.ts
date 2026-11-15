import type { Attachment } from 'svelte/attachments';

/**
 * Setzt `data-shown`, sobald der Abschnitt ins Bild scrollt. Das CSS baut die Grafik dann ruhig auf;
 * bei prefers-reduced-motion zeigt es sie sofort (siehe skizze.css).
 */
export const reveal: Attachment<HTMLElement> = (node) => {
	if (typeof IntersectionObserver === 'undefined') {
		node.dataset.shown = '';
		return;
	}
	const io = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				node.dataset.shown = '';
				io.disconnect();
			}
		},
		{ threshold: 0.2 }
	);
	io.observe(node);
	return () => io.disconnect();
};
