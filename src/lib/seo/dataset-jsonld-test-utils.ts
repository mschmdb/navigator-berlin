import { expect } from 'vitest';

export interface RenderedDatasetJsonLd {
	'@id': string;
	url: string;
	dateModified: string;
	description?: string;
	temporalCoverage?: string;
	creator: { name: string; url?: string };
	distribution: { contentUrl: string };
	spatialCoverage: { geo: { box: string } };
}

/** Liest das Dataset-JSON-LD aus dem gerenderten Dokument. */
export function readDatasetJsonLd(): RenderedDatasetJsonLd {
	const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
	const dataset = scripts
		.map((s) => JSON.parse(s.textContent ?? '{}') as { '@type'?: string })
		.find((j) => j['@type'] === 'Dataset');
	expect(dataset).toBeDefined();
	return dataset as unknown as RenderedDatasetJsonLd;
}
