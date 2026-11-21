import type { AddressInfo } from 'node:net';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAppServer } from '../server.js';

function fakeHandler(req: IncomingMessage, res: ServerResponse): void {
	const path = (req.url ?? '/').split('?')[0];
	if (path.endsWith('/missing.woff2') || path === '/fonts/') {
		res.statusCode = 404;
		res.end('not found');
		return;
	}
	if (path === '/og/explicit-404.png') {
		res.writeHead(404, { 'content-type': 'text/plain' });
		res.end('not found');
		return;
	}
	res.writeHead(200, { 'content-type': 'application/octet-stream' });
	res.end('ok');
}

let server: Server;
let base: string;

beforeAll(async () => {
	server = createAppServer(fakeHandler);
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
	await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function cacheControl(path: string): Promise<{ status: number; value: string | null }> {
	const res = await fetch(base + path);
	await res.text();
	return { status: res.status, value: res.headers.get('cache-control') };
}

describe('server.js Cache-Control', () => {
	it('marks existing fonts as immutable', async () => {
		expect(await cacheControl('/fonts/jost-latin-var.woff2')).toEqual({
			status: 200,
			value: 'public, max-age=31536000, immutable'
		});
	});

	it('does not mark a missing font as immutable', async () => {
		const res = await cacheControl('/fonts/missing.woff2');
		expect(res.status).toBe(404);
		expect(res.value).toBeNull();
	});

	it('does not cache the bare /fonts/ 404', async () => {
		const res = await cacheControl('/fonts/');
		expect(res.status).toBe(404);
		expect(res.value).toBeNull();
	});

	it('drops the header when the handler calls writeHead with an error status', async () => {
		const res = await cacheControl('/og/explicit-404.png');
		expect(res.status).toBe(404);
		expect(res.value).toBeNull();
	});

	it('keeps the rule for successful og images', async () => {
		expect((await cacheControl('/og/page/home.png')).value).toBe(
			'public, max-age=86400, stale-while-revalidate=604800'
		);
	});

	it('leaves other paths alone', async () => {
		expect((await cacheControl('/explore')).value).toBeNull();
	});
});
