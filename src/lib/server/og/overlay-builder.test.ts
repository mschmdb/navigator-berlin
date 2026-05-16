import { describe, it, expect } from 'vitest';
import { toBase64DataUri } from './overlay-builder.js';

describe('toBase64DataUri', () => {
	it('encodes Buffer to a data:image/png;base64 URI', () => {
		const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
		const uri = toBase64DataUri(png, 'image/png');
		expect(uri.startsWith('data:image/png;base64,')).toBe(true);
		expect(uri.length).toBe('data:image/png;base64,'.length + Math.ceil(png.length / 3) * 4);
	});

	it('encodes empty buffer to data-URI with empty payload', () => {
		const uri = toBase64DataUri(Buffer.alloc(0), 'image/png');
		expect(uri).toBe('data:image/png;base64,');
	});
});
