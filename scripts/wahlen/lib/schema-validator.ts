export type SchemaDrift = {
	missing: string[];
	added: string[];
	matched: number;
};

export function diffHeaders(
	expected: readonly string[],
	actual: readonly string[]
): SchemaDrift {
	const expectedSet = new Set(expected);
	const actualSet = new Set(actual);
	const missing = expected.filter((h) => !actualSet.has(h));
	const added = actual.filter((h) => !expectedSet.has(h));
	const matched = expected.filter((h) => actualSet.has(h)).length;
	return { missing, added, matched };
}

export function isDrift(diff: SchemaDrift): boolean {
	return diff.missing.length > 0 || diff.added.length > 0;
}

export function formatDriftReport(diff: SchemaDrift): string {
	const lines: string[] = [];
	if (diff.missing.length > 0) {
		lines.push('Missing columns (in snapshot, not in real CSV):');
		for (const m of diff.missing) lines.push(`  - ${m}`);
	}
	if (diff.added.length > 0) {
		lines.push('Added columns (in real CSV, not in snapshot):');
		for (const a of diff.added) lines.push(`  + ${a}`);
	}
	if (lines.length === 0) lines.push('No drift.');
	return lines.join('\n');
}
