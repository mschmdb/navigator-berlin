import { createHash } from 'node:crypto';

/** Absätze normalisieren (Whitespace), damit Formatierung den Hash nicht ändert. */
export function hashProfileParagraphs(paragraphs: readonly string[]): string {
	const normalized = paragraphs.map((p) => p.replace(/\s+/g, ' ').trim()).join('\n\n');
	return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export function splitParagraphs(content: string): string[] {
	return content
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter((p) => p.length > 0);
}
