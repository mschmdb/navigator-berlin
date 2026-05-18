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
import { handler } from './build/handler.js';

const ONE_YEAR = 31_536_000;
const ONE_WEEK = 604_800;
const ONE_DAY = 86_400;

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

function applyCacheHeader(req, res) {
	const url = req.url || '/';
	const path = url.split('?')[0];
	for (const rule of CACHE_RULES) {
		if (rule.test(path)) {
			res.setHeader('Cache-Control', rule.value);
			return;
		}
	}
}

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const httpServer = createServer((req, res) => {
	applyCacheHeader(req, res);
	handler(req, res);
});

httpServer.listen(port, host, () => {
	console.log(`navigator.berlin server listening on http://${host}:${port}`);
});

function shutdown() {
	httpServer.close(() => process.exit(0));
	setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
