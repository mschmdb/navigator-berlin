import type { RequestHandler } from './$types';

export const prerender = true;

/**
 * robots.txt mit AI-Bot-Policy + Crawl-Budget-Hints.
 *
 * Geschichte:
 * - Story 2.1: Allow-All + Sitemap-Reference.
 * - Story 2.8: llms.txt-Hinweis.
 * - Story 5.9 (AC-1): explizite AI-Bot-Allowlist (GPTBot, ClaudeBot, etc.),
 *   Spam-Bot-Disallow (Omgilibot, MJ12bot), Crawl-Budget-Disallow fuer
 *   /api/. Yandex bewusst nicht gelistet (User-Decision).
 *
 * Sonst lebende Indexierungs-Annahmen siehe Memory `project_seo_bot_policy`.
 */

const ALLOW_AI_BOTS: readonly string[] = [
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
];

const DISALLOW_SPAM_BOTS: readonly string[] = ['Omgilibot', 'MJ12bot'];

function renderBotBlock(name: string, directive: 'Allow' | 'Disallow'): string {
	return `User-agent: ${name}\n${directive}: /`;
}

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const lines: string[] = [];

	lines.push('# Default-Block fuer alle nicht explizit aufgefuehrten Crawler');
	lines.push('User-agent: *');
	lines.push('Allow: /');
	lines.push('Disallow: /api/');
	// WICHTIG: /layers/ NICHT disallowen. MANIFEST.json + GeoJSON sind
	// render-nötige Ressourcen (client-seitiger loadManifest); ein robots-Block
	// lässt Googlebots Render-Fetch fehlschlagen → Load wirft → 500-Page →
	// Soft-404. Crawl-Budget-Schonung für Datenfiles ginge nur via
	// X-Robots-Tag: noindex (erlaubt Fetch, schließt aus Index), nicht via Disallow.
	lines.push('');

	lines.push('# AI-Crawler explizit Allow (Story 5.9, Memory project_seo_bot_policy)');
	for (const bot of ALLOW_AI_BOTS) {
		lines.push(renderBotBlock(bot, 'Allow'));
		lines.push('');
	}

	lines.push('# Low-quality Scraper explizit Disallow');
	for (const bot of DISALLOW_SPAM_BOTS) {
		lines.push(renderBotBlock(bot, 'Disallow'));
		lines.push('');
	}

	lines.push(`Sitemap: ${origin}/sitemap.xml`);
	lines.push('');
	lines.push('# LLM-friendly: /llms.txt + /llms-full.txt (story 2.8)');
	lines.push('');

	const body = lines.join('\n');
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
