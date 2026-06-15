import { createHash } from 'node:crypto';

export function sha256Hex(buf: Buffer | Uint8Array): string {
	return createHash('sha256').update(buf).digest('hex');
}

export function shortHash(hex: string): string {
	return hex.slice(0, 8);
}

export function hashedFilename(
	slug: string,
	content: Buffer | Uint8Array,
	ext = 'geojson'
): string {
	return `${slug}.${shortHash(sha256Hex(content))}.${ext}`;
}
