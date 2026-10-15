/**
 * Strict-Build-Flag (S5). `vite build` setzt NODE_ENV=production selbst, deshalb
 * taugt NODE_ENV nicht als Signal. Das Dockerfile setzt NAVIGATOR_STRICT_BUILD=1.
 * Lokale Builds laufen ohne Flag und warnen nur.
 *
 * Reines JS, damit `svelte.config.js` das Modul ohne TS-Loader importieren kann.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function isStrictBuild(env = process.env) {
	return env.NAVIGATOR_STRICT_BUILD === '1';
}

/**
 * Baut den `prerender.handleHttpError`-Handler: im strikten Build bricht jeder
 * Prerender-HTTP-Fehler ab, außer der Pfad steht in der Allowlist.
 *
 * @param {readonly string[]} allowedPaths
 * @returns {(error: { path: string, referrer: string | null, message: string }) => void}
 */
export function createHandleHttpError(allowedPaths) {
	return ({ path, referrer, message }) => {
		const text = `[prerender] ${message} (referrer: ${referrer})`;
		if (isStrictBuild() && !allowedPaths.includes(path)) throw new Error(text);
		console.warn(text);
	};
}
