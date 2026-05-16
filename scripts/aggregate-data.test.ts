import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { aggregateAll } from './aggregate-data.js';
import type { BezirkAggregateRow, KiezAggregateRow } from './aggregate/types.js';

function stableHash(rows: ReadonlyArray<BezirkAggregateRow | KiezAggregateRow>): string {
	// Deterministische Serialisierung: nach slug sortieren, JSON-Keys auch sortieren.
	const sorted = [...rows].sort((a, b) => a.slug.localeCompare(b.slug));
	const canonical = JSON.stringify(sorted, Object.keys(sorted[0] ?? {}).sort());
	return createHash('sha256').update(canonical).digest('hex');
}

describe('aggregate-data deterministic / idempotent (Story 2.0 AC-4, T5.7)', () => {
	it('two consecutive runs produce identical aggregate rows (modulo computed_at)', async () => {
		const a = await aggregateAll();
		const b = await aggregateAll();
		expect(stableHash(a.bezirke)).toBe(stableHash(b.bezirke));
		expect(stableHash(a.kieze)).toBe(stableHash(b.kieze));
	}, 120_000);

	it('produces 12 bezirk rows + 143 kiez rows', async () => {
		const { bezirke, kieze } = await aggregateAll();
		expect(bezirke).toHaveLength(12);
		expect(kieze).toHaveLength(143);
	}, 60_000);
});
