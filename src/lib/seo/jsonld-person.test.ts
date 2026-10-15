import { describe, expect, it } from 'vitest';
import {
	FOUNDER_ID,
	FOUNDER_PROFILE_URLS,
	buildFounderPerson,
	founderRef
} from './jsonld-person.js';

describe('buildFounderPerson', () => {
	it('liefert Person mit stabiler @id, Name, url, jobTitle und sameAs', () => {
		expect(buildFounderPerson()).toEqual({
			'@type': 'Person',
			'@id': 'https://schmidbauer.dev/#person',
			name: 'Matze Schmidbauer',
			url: 'https://schmidbauer.dev',
			jobTitle: 'Solutions Architect',
			sameAs: [
				'https://bsky.app/profile/schmidbauer.dev',
				'https://www.linkedin.com/in/matzeschmidbauer/'
			]
		});
	});

	it('FOUNDER_ID endet auf #person', () => {
		expect(FOUNDER_ID).toBe('https://schmidbauer.dev/#person');
	});

	it('gibt eine Kopie von sameAs zurück (keine geteilte Referenz)', () => {
		const person = buildFounderPerson();
		person.sameAs.push('https://example.org');
		expect(buildFounderPerson().sameAs).toHaveLength(2);
		expect(FOUNDER_PROFILE_URLS.bluesky).toContain('bsky.app');
	});

	it('founderRef trägt nur @type, @id und name', () => {
		expect(founderRef()).toEqual({
			'@type': 'Person',
			'@id': 'https://schmidbauer.dev/#person',
			name: 'Matze Schmidbauer'
		});
	});
});
