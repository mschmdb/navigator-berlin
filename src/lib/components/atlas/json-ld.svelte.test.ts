import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import JsonLd from './json-ld.svelte';

const sample = {
	'@context': 'https://schema.org' as const,
	'@type': 'WebSite',
	name: 'navigator.berlin',
	url: 'https://navigator.berlin'
};

describe('JsonLd.svelte', () => {
	it('rendert script[type="application/ld+json"] mit data-testid in head', async () => {
		render(JsonLd, { data: sample, testid: 'jsonld-test' });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="jsonld-test"]'
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed['@type']).toBe('WebSite');
		expect(parsed.name).toBe('navigator.berlin');
	});

	it('rendert auch ohne testid (script ohne data-testid)', async () => {
		render(JsonLd, { data: sample });
		const scripts = document.querySelectorAll('script[type="application/ld+json"]');
		const nonTestidScripts = Array.from(scripts).filter((s) => !s.hasAttribute('data-testid'));
		expect(nonTestidScripts.length).toBeGreaterThanOrEqual(1);
	});

	it('escapes </script> Sequence im Output (XSS-Schutz)', async () => {
		const dangerous = {
			'@context': 'https://schema.org' as const,
			'@type': 'WebSite',
			name: 'evil</script><script>alert(1)</script>'
		};
		render(JsonLd, { data: dangerous, testid: 'jsonld-xss' });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="jsonld-xss"]'
		);
		const raw = script?.textContent ?? '';
		// Original-Substring darf nicht raw drin sein
		expect(raw).not.toContain('</script><script>alert');
		// Escaped-Variante muss drin sein
		expect(raw).toContain('<\\/script>');
		// Trotzdem parsbar
		const parsed = JSON.parse(raw);
		expect(parsed.name).toBe('evil</script><script>alert(1)</script>');
	});
});
