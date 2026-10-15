import { describe, expect, it } from 'vitest';
import { GET } from './+server.js';

const MOCK_URL = new URL('https://navigator.berlin/robots.txt');
const mockEvent = { url: MOCK_URL } as Parameters<typeof GET>[0];

async function fetchRobots(): Promise<string> {
	const res = await GET(mockEvent);
	return await res.text();
}

describe('robots.txt Endpoint (Story 5.9 AC-1)', () => {
	it('content-type text/plain charset utf-8', async () => {
		const res = await GET(mockEvent);
		expect(res.headers.get('content-type')).toContain('text/plain');
	});

	it('default User-agent * mit Allow:/ + Sitemap', async () => {
		const body = await fetchRobots();
		expect(body).toMatch(/^User-agent: \*$/m);
		expect(body).toMatch(/^Allow: \/$/m);
		expect(body).toMatch(/^Sitemap: https:\/\/navigator\.berlin\/sitemap\.xml$/m);
	});

	it('default-Block disallowed /api/', async () => {
		const body = await fetchRobots();
		expect(body).toMatch(/^Disallow: \/api\/$/m);
	});

	it('blockt /layers/ NICHT (render-nötige Ressourcen, sonst Soft-404)', async () => {
		const body = await fetchRobots();
		expect(body).not.toMatch(/^Disallow: \/layers\/$/m);
	});

	for (const bot of [
		'GPTBot',
		'OAI-SearchBot',
		'ChatGPT-User',
		'ClaudeBot',
		'anthropic-ai',
		'PerplexityBot',
		'Google-Extended',
		'CCBot',
		'Bytespider',
		'Amazonbot',
		'Applebot-Extended'
	]) {
		it(`AI-Bot ${bot} explizit Allow: /`, async () => {
			const body = await fetchRobots();
			const escaped = bot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const pattern = new RegExp(`^User-agent: ${escaped}\\nAllow: \\/$`, 'm');
			expect(body, `Erwartet User-agent: ${bot}\\nAllow: /`).toMatch(pattern);
		});
	}

	for (const bot of ['Omgilibot', 'MJ12bot']) {
		it(`Spam-Bot ${bot} explizit Disallow: /`, async () => {
			const body = await fetchRobots();
			const escaped = bot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const pattern = new RegExp(`^User-agent: ${escaped}\\nDisallow: \\/$`, 'm');
			expect(body).toMatch(pattern);
		});
	}

	it('Yandex NICHT explizit gelistet (User-Decision)', async () => {
		const body = await fetchRobots();
		expect(body.toLowerCase()).not.toContain('yandex');
	});

	it('llms.txt-Hinweis bleibt erhalten', async () => {
		const body = await fetchRobots();
		expect(body).toContain('llms.txt');
	});
});

describe('robots.txt: Disallow /api/ in Allow-Gruppen (S1)', () => {
	it('jede Allow-Gruppe enthält Disallow: /api/', async () => {
		const body = await fetchRobots();
		const groups = body.split(/\n\n+/).filter((g) => /^User-agent: /m.test(g));
		const allowGroups = groups.filter((g) => /^Allow: \/$/m.test(g));
		expect(allowGroups.length).toBeGreaterThan(10);
		for (const group of allowGroups) {
			expect(group).toMatch(/^Disallow: \/api\/$/m);
			expect(group).toMatch(/^Disallow: \/en\/api\/$/m);
		}
	});
});

describe('robots.txt: /en/api/ (S1)', () => {
	it('Default-Block disallowed /en/api/', async () => {
		expect(await fetchRobots()).toMatch(/^Disallow: \/en\/api\/$/m);
	});
});
