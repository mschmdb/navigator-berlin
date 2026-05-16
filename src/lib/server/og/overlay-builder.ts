/**
 * Helper: Buffer → data-URI für Satori-`backgroundImage`. Satori unterstützt
 * SVG/PNG-Data-URIs als Background; das ist der einzige Weg, einen extern
 * gerenderten Karten-Snapshot in die OG-Card zu komponieren.
 */

export function toBase64DataUri(buffer: Buffer, mime: 'image/png' | 'image/jpeg'): string {
	return `data:${mime};base64,${buffer.toString('base64')}`;
}
