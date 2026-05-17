import { describe, expect, it } from 'vitest';
import { parseSprintStatus, renderStoryMapMarkdown } from './generate-story-map.js';

const yamlFixture = `
last_updated: 2026-05-17
development_status:
  epic-1: done
  1-1-foo: done
  1-2-bar: review
  epic-7: in-progress
  7-1-auto-doc: cancelled  # 2026-05-17 reason
  7-2-tree: ready-for-dev
  7-5-recovery: done  # done today
`;

describe('parseSprintStatus', () => {
	it('mapt nur number-prefixed Keys (epic-X gefiltert)', () => {
		const rows = parseSprintStatus(yamlFixture);
		const keys = rows.map((r) => r.key);
		expect(keys).toEqual(['1-1-foo', '1-2-bar', '7-1-auto-doc', '7-2-tree', '7-5-recovery']);
	});

	it('extrahiert Epic-Prefix korrekt', () => {
		const rows = parseSprintStatus(yamlFixture);
		expect(rows[0].epic).toBe('Epic 1');
		expect(rows[2].epic).toBe('Epic 7');
	});

	it('splittet status # comment', () => {
		const rows = parseSprintStatus(yamlFixture);
		const cancelled = rows.find((r) => r.key === '7-1-auto-doc');
		expect(cancelled?.status).toBe('cancelled');
		expect(cancelled?.comment).toContain('2026-05-17 reason');
	});

	it('leeres YAML → leeres Array', () => {
		expect(parseSprintStatus('')).toEqual([]);
	});

	it('YAML ohne development_status-Key → leeres Array', () => {
		expect(parseSprintStatus('foo: bar')).toEqual([]);
	});
});

describe('renderStoryMapMarkdown', () => {
	it('rendert Frontmatter mit type/audience/last-verified', () => {
		const md = renderStoryMapMarkdown(parseSprintStatus(yamlFixture), '2026-05-17');
		expect(md).toContain('type: architecture');
		expect(md).toContain('audience: both');
		expect(md).toContain('last-verified: 2026-05-17');
	});

	it('zeigt Total + Counts im Header', () => {
		const md = renderStoryMapMarkdown(parseSprintStatus(yamlFixture), '2026-05-17');
		expect(md).toContain('5 Stories total');
		expect(md).toContain('done');
		expect(md).toContain('cancelled');
	});

	it('rendert pro Epic eine Tabelle', () => {
		const md = renderStoryMapMarkdown(parseSprintStatus(yamlFixture), '2026-05-17');
		expect(md).toContain('### Epic 1');
		expect(md).toContain('### Epic 7');
	});

	it('Status-Badges für bekannte States', () => {
		const md = renderStoryMapMarkdown(parseSprintStatus(yamlFixture), '2026-05-17');
		expect(md).toContain('✅ done');
		expect(md).toContain('❌ cancelled');
		expect(md).toContain('📋 ready-for-dev');
	});

	it('lange Kommentare werden gekürzt mit …', () => {
		const longYaml = `
development_status:
  1-1-foo: done  # ${'x'.repeat(200)}
`;
		const md = renderStoryMapMarkdown(parseSprintStatus(longYaml), '2026-05-17');
		expect(md).toContain('…');
	});
});
