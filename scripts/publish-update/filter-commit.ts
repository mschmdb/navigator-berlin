/**
 * Allowlist/Denylist-Filter pro Commit. Story 5.8 AC-3.
 *
 * Reine Klassifikations-Logik isoliert von I/O: nimmt File-Liste als
 * Input, der Caller liefert `git show --name-only`-Output (oder Mock im Test).
 */

export const ALLOWLIST_PATTERNS: readonly RegExp[] = [
	/^src\/routes\//,
	/^src\/lib\/components\//,
	/^src\/lib\/data\//,
	/^src\/lib\/seo\//,
	/^src\/lib\/content\//,
	/^static\/layers\/MANIFEST\.json$/,
	/^_content\/updates\//,
	/^_content\/methodik\//
];

export const DENYLIST_PATTERNS: readonly RegExp[] = [
	/^\.env/,
	/\.env\./,
	/^lefthook\.yml$/,
	/^coolify\.(yml|yaml|json)$/,
	/^docker-compose\.ya?ml$/,
	/^Dockerfile$/,
	/^docs\/recovery\//,
	/^docs\/adr\/ADR-\d+/,
	/^\.github\/workflows\//,
	/^scripts\/lib\/sources\.ts$/,
	/^_bmad-output\//,
	/^_bmad\//,
	/^\.claude\/skills\//,
	/^\.config\/navigator\//
];

export interface FilterResult {
	relevant: boolean;
	reason: string;
	publicPaths: string[];
}

export function classifyChangedFiles(files: readonly string[]): FilterResult {
	if (files.length === 0) {
		return { relevant: false, reason: 'leerer Diff (Merge-Commit ohne Inhalt)', publicPaths: [] };
	}

	const denylisted = files.filter((f) => DENYLIST_PATTERNS.some((re) => re.test(f)));
	const allowlisted = files.filter((f) => ALLOWLIST_PATTERNS.some((re) => re.test(f)));

	if (denylisted.length > 0 && allowlisted.length > 0) {
		return {
			relevant: false,
			reason: `mixed allowlist + denylist (Commit aufsplitten): denylist=${denylisted.join(',')}, allowlist=${allowlisted.join(',')}`,
			publicPaths: []
		};
	}

	if (denylisted.length > 0) {
		return {
			relevant: false,
			reason: `alle Files denylist: ${denylisted.join(',')}`,
			publicPaths: []
		};
	}

	if (allowlisted.length === 0) {
		return {
			relevant: false,
			reason: 'keine Allowlist-Match',
			publicPaths: []
		};
	}

	return {
		relevant: true,
		reason: `allowlist-match: ${allowlisted[0]}${allowlisted.length > 1 ? ` (+${allowlisted.length - 1})` : ''}`,
		publicPaths: allowlisted
	};
}
