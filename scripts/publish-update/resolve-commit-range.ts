/**
 * Argv-Parser für /publish-update. Story 5.8 AC-2.
 *
 * Akzeptiert:
 *   - Git-Range-Expression als erstes positional arg (z.B. HEAD~7..HEAD, sha..sha)
 *   - --since=YYYY-MM-DD
 *   - --commit=<sha>  (single-commit mode)
 *   - kein arg → default --since=heute minus 1 Tag
 */

export type RangeArg =
	| { kind: 'range'; expr: string }
	| { kind: 'commit'; sha: string }
	| { kind: 'error'; message: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseRangeArgs(argv: readonly string[]): RangeArg {
	for (const a of argv) {
		if (a.startsWith('--commit=')) {
			const sha = a.slice('--commit='.length);
			if (!sha) return { kind: 'error', message: '--commit= requires a sha' };
			return { kind: 'commit', sha };
		}
		if (a.startsWith('--since=')) {
			const dateStr = a.slice('--since='.length);
			if (!ISO_DATE.test(dateStr)) {
				return { kind: 'error', message: '--since= requires YYYY-MM-DD' };
			}
			return { kind: 'range', expr: a };
		}
		if (!a.startsWith('--') && a.length > 0) {
			return { kind: 'range', expr: a };
		}
	}

	const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const iso = yesterday.toISOString().slice(0, 10);
	return { kind: 'range', expr: `--since=${iso}` };
}
