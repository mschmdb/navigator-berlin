/**
 * Teilt den Markdown-Text eines Beitrags am Marker `<!-- visual -->`: Text davor
 * steht über der Visualisierung, Text danach darunter. Ohne Marker steht der ganze
 * Text unter der Visualisierung.
 */
const MARKER = /^[ \t]*<!--\s*visual\s*-->[ \t]*$/m;

export interface SplitBody {
	readonly before: string;
	readonly after: string;
}

export function splitAtVisual(body: string): SplitBody {
	const match = MARKER.exec(body);
	if (!match) return { before: '', after: body.trim() };
	return {
		before: body.slice(0, match.index).trim(),
		after: body.slice(match.index + match[0].length).trim()
	};
}
