/**
 * Custom Node-Entry der SvelteKit-adapter-node-Default-Server ersetzt.
 * Grund: Cache-Control-Header für static Assets setzen.
 *
 * adapter-node serviert static-files via sirv ohne Cache-Header (außer
 * /_app/immutable/ → immutable). Lighthouse-Audit „efficient cache lifetimes"
 * meckert über /og/, /layers/, /fonts/. Diese Middleware setzt Cache-Control
 * BEVOR der adapter-handler den Request übernimmt.
 *
 * Pattern: minimal-Node-http-Wrapper statt polka/express, zero-extra-Deps.
 */

import { createServer } from 'node:http';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ONE_YEAR = 31_536_000;
const ONE_WEEK = 604_800;
const ONE_DAY = 86_400;

/** @type {ReadonlyArray<{ test: (path: string) => boolean, value: string }>} */
const CACHE_RULES = [
	{
		test: (p) => p.startsWith('/_app/immutable/'),
		value: `public, max-age=${ONE_YEAR}, immutable`
	},
	{
		test: (p) => p.startsWith('/og/'),
		value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`
	},
	{
		test: (p) => p.startsWith('/layers/'),
		value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`
	},
	{
		test: (p) => p.startsWith('/fonts/'),
		value: `public, max-age=${ONE_YEAR}, immutable`
	},
	{
		test: (p) => /\.(svg|png|jpe?g|webp|avif|ico|woff2?|ttf)$/i.test(p),
		value: `public, max-age=${ONE_WEEK}`
	}
];

/** @param {string | undefined} url */
function cacheControlFor(url) {
	const path = (url || '/').split('?')[0];
	return CACHE_RULES.find((rule) => rule.test(path))?.value;
}

/**
 * Setzt Cache-Control vor dem Handler. Antwortet der Handler mit einem Fehler (>= 400),
 * fällt der Header wieder weg: ein 404 unter /fonts/ darf nicht `immutable` im Cache landen.
 * Node ruft `writeHead` auch beim impliziten Header-Write über `res.statusCode`.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function applyCacheHeader(req, res) {
	const value = cacheControlFor(req.url);
	if (!value) return;
	res.setHeader('Cache-Control', value);
	const writeHead = res.writeHead;
	/** @type {typeof res.writeHead} */
	const patched = function (statusCode, ...rest) {
		if (statusCode >= 400 && res.getHeader('Cache-Control') === value) {
			res.removeHeader('Cache-Control');
		}
		// @ts-expect-error Die Overloads von writeHead lassen sich nicht generisch weiterreichen.
		return writeHead.call(this, statusCode, ...rest);
	};
	res.writeHead = patched;
}

/** @param {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void} handler */
export function createAppServer(handler) {
	return createServer((req, res) => {
		applyCacheHeader(req, res);
		handler(req, res);
	});
}

function isMainEntry() {
	if (!process.argv[1]) return false;
	return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
}

if (isMainEntry()) {
	// Pfad als Variable: Typecheck und Tests laden den Build-Output nicht mit.
	const handlerModule = './build/handler.js';
	const { handler } = await import(handlerModule);
	const port = Number.parseInt(process.env.PORT ?? '3000', 10);
	const host = process.env.HOST ?? '0.0.0.0';
	const httpServer = createAppServer(handler);

	httpServer.listen(port, host, () => {
		console.log(`navigator.berlin server listening on http://${host}:${port}`);
	});

	const shutdown = () => {
		httpServer.close(() => process.exit(0));
		setTimeout(() => process.exit(1), 10_000).unref();
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
