import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './serialize-jsonld.js';

describe('serializeJsonLd', () => {
	it('escapes </script> mit Backslash', () => {
		const out = serializeJsonLd({ foo: 'a</script>b' });
		expect(out).toContain('<\\/script>');
		expect(out).not.toContain('a</script>b');
	});

	it('escapes alle </-Sequences (auch </style etc.)', () => {
		const out = serializeJsonLd({ foo: 'x</style>y</a>z' });
		expect(out).toContain('<\\/style>');
		expect(out).toContain('<\\/a>');
	});

	it('Round-Trip-Parse nach Re-Substitution funktioniert', () => {
		const original = { headline: 'Hello</script>World', n: 42 };
		const out = serializeJsonLd(original);
		// Browser-Parser de-escaped <\/ → </ automatisch (inline-Script-Boundary)
		const reparsed = JSON.parse(out.replace(/<\\\//g, '</'));
		expect(reparsed).toEqual(original);
	});

	it('plain JSON ohne </ bleibt unveraendert lesbar', () => {
		const out = serializeJsonLd({ a: 1, b: 'hallo' });
		expect(JSON.parse(out)).toEqual({ a: 1, b: 'hallo' });
	});
});
