/**
 * Forbidden-Token-Lint für /publish-update-Body. Story 5.8 AC-5.
 *
 * Defense-in-Depth gegen Subagent-Halluzinationen oder versehentliche
 * Internals-Leaks. Linter wandert über jede Zeile + sammelt ALLE
 * Verstöße inkl. Zeilennummer. Kein early-exit.
 *
 * Pflege-Doku: docs/runbooks/publish-update-skill.md („Forbidden-Tokens
 * erweitern" Section).
 */

interface Pattern {
	readonly name: string;
	readonly regex: RegExp;
}

export const FORBIDDEN_PATTERNS: readonly Pattern[] = [
	{ name: 'em-dash', regex: /—/ },
	{ name: 'lebenswert', regex: /\blebenswert\w*/i },
	{
		name: 'env-var-uppercase',
		regex: /\b[A-Z][A-Z0-9_]*_(KEY|TOKEN|SECRET|URL|HOST|PASSWORD|PASS)\b/
	},
	{ name: 'hetzner', regex: /\bhetzner\b|\bcpx\d+\b|\bcax\d+\b/i },
	{ name: 'coolify', regex: /\bcoolify\b/i },
	{ name: 'lefthook', regex: /\blefthook\b/i },
	{ name: 'github-actions-internal', regex: /\.github\/workflows/ },
	{ name: 'commit-sha', regex: /\b[0-9a-f]{7,40}\b/ },
	{ name: 'traefik', regex: /\btraefik\b/i },
	{ name: 'crowdsec', regex: /\bcrowdsec\b/i },
	{ name: 'postgres-internal', regex: /\bDATABASE_URL\b|\bDRIZZLE_/ },
	{ name: 'docker', regex: /\bdocker-compose\b|\bdocker\.io\b/i },
	{ name: 'absolute-fs-path', regex: /\/Users\/|\/home\/[^/\s)]+\/|C:\\\\Users\\\\/ },
	{ name: 'mietpreis-eurom2', regex: /\d+[,.]?\d*\s*€\s*\/\s*m[²2]/ }
];

export interface LintViolation {
	readonly token: string;
	readonly line: number;
	readonly snippet: string;
}

export interface LintResult {
	readonly ok: boolean;
	readonly violations: readonly LintViolation[];
}

export function lintBody(body: string): LintResult {
	const violations: LintViolation[] = [];
	const lines = body.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const p of FORBIDDEN_PATTERNS) {
			const m = line.match(p.regex);
			if (m) {
				violations.push({
					token: p.name,
					line: i + 1,
					snippet: line.trim().slice(0, 120)
				});
			}
		}
	}
	return { ok: violations.length === 0, violations };
}
