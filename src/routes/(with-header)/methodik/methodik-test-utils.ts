/** Geteilte Helfer für die Methodik-Seitentests (i18n C4a). */

const TEXT_SELECTOR = 'h1, h2, h3, p, li, dt, dd, th, td, caption, figcaption, summary, a';

/** Sichtbare Textbausteine in DOM-Reihenfolge, Whitespace normalisiert, eine Zeile je Element. */
export function textLines(root: Element): string {
	const lines: string[] = [];
	for (const el of root.querySelectorAll(TEXT_SELECTOR)) {
		if (el.tagName === 'LI' && el.querySelector('p, dt, dd, a')) continue;
		const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
		if (text) lines.push(`${el.tagName.toLowerCase()}: ${text}`);
	}
	return lines.join('\n') + '\n';
}

/** Alle internen Link-Ziele (beginnen mit `/`), ohne Anker und mailto. */
export function internalHrefs(root: Element): string[] {
	return [...root.querySelectorAll('a[href]')]
		.map((a) => a.getAttribute('href') ?? '')
		.filter((href) => href.startsWith('/'));
}
