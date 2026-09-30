import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebMcpServerHandle } from './adapter.js';

/**
 * Regressionstest für die Mount-Race (diagnostiziert 04.09.2026):
 * Layout-$effect und /webmcp-Diagnose rufen mountWebMcpServer() fast
 * gleichzeitig. Der alte Guard prüfte nur das fertige Handle, beide
 * Aufrufer passierten ihn und der Verlierer bekam vom Browser
 * "Duplicate tool name". Erwartung: genau EIN registerWebMcpServer-Call,
 * alle Aufrufer teilen dasselbe Handle.
 */

const hoisted = vi.hoisted(() => ({
	registerWebMcpServer: vi.fn<(deps?: unknown) => Promise<WebMcpServerHandle>>()
}));

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('./adapter.js', () => ({
	registerWebMcpServer: hoisted.registerWebMcpServer,
	loadMcpBGlobalPolyfill: vi.fn()
}));

vi.mock('$lib/data/geocode.remote', () => ({ geocodeAddress: vi.fn() }));
vi.mock('$lib/data/get-layers-at-point', () => ({ getLayersAtPoint: vi.fn() }));
vi.mock('$lib/data/get-kiez-profile', () => ({ getKiezProfile: vi.fn() }));
vi.mock('$lib/data/get-layer-metadata', () => ({ getLayerMetadata: vi.fn() }));
vi.mock('$lib/data/layer-methodology', () => ({ getLayerMethodology: vi.fn() }));
vi.mock('$lib/data/manifest', () => ({ loadManifest: vi.fn() }));
vi.mock('$lib/paraglide/runtime', () => ({ getLocale: () => 'de' }));
vi.mock('$lib/state/finder-bridge.svelte', () => ({
	readFinderPublishSeq: vi.fn(() => 0),
	requestAgentWeights: vi.fn(),
	readFinderBridge: vi.fn(() => ({ panelActive: false, party: null })),
	waitForFinderTopMatches: vi.fn(async () => [])
}));

function makeHandle(): WebMcpServerHandle {
	return { unregister: vi.fn() } as unknown as WebMcpServerHandle;
}

async function importMount() {
	return await import('./mount.js');
}

beforeEach(() => {
	vi.resetModules();
	hoisted.registerWebMcpServer.mockReset();
});

describe('mountWebMcpServer', () => {
	it('registriert bei zwei parallelen Aufrufen genau einmal', async () => {
		const handle = makeHandle();
		// Async-Lücke wie im echten Adapter: Registration dauert einen Tick.
		hoisted.registerWebMcpServer.mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
			return handle;
		});
		const { mountWebMcpServer } = await importMount();

		const [first, second] = await Promise.all([mountWebMcpServer(), mountWebMcpServer()]);

		expect(hoisted.registerWebMcpServer).toHaveBeenCalledTimes(1);
		expect(first).toBe(handle);
		expect(second).toBe(handle);
	});

	it('liefert nach abgeschlossenem Mount dasselbe Handle ohne Neu-Registrierung', async () => {
		const handle = makeHandle();
		hoisted.registerWebMcpServer.mockResolvedValue(handle);
		const { mountWebMcpServer } = await importMount();

		const first = await mountWebMcpServer();
		const second = await mountWebMcpServer();

		expect(hoisted.registerWebMcpServer).toHaveBeenCalledTimes(1);
		expect(second).toBe(first);
	});

	it('erlaubt nach fehlgeschlagenem Mount einen neuen Versuch', async () => {
		const handle = makeHandle();
		hoisted.registerWebMcpServer
			.mockRejectedValueOnce(new Error('registration failed'))
			.mockResolvedValueOnce(handle);
		const { mountWebMcpServer } = await importMount();

		await expect(mountWebMcpServer()).rejects.toThrow('registration failed');
		await expect(mountWebMcpServer()).resolves.toBe(handle);
		expect(hoisted.registerWebMcpServer).toHaveBeenCalledTimes(2);
	});

	it('registriert nach unmount wieder neu', async () => {
		const handle = makeHandle();
		hoisted.registerWebMcpServer.mockResolvedValue(handle);
		const { mountWebMcpServer, unmountWebMcpServer } = await importMount();

		await mountWebMcpServer();
		unmountWebMcpServer();
		await mountWebMcpServer();

		expect(handle.unregister).toHaveBeenCalledTimes(1);
		expect(hoisted.registerWebMcpServer).toHaveBeenCalledTimes(2);
	});
});

// i18n Block C2 (spec-i18n-c2-layer-methodik.md, Boundary "WebMCP bleibt
// DE"): dieser Test verdrahtet die ECHTE `$lib/data/layer-methodology` und
// die ECHTE `$lib/paraglide/runtime` statt der oben gemockten Stand-ins --
// nur so lässt sich zeigen, dass `deps.getLayerMethodology`, das `mount.ts`
// tatsächlich an `registerWebMcpServer` übergibt, unter einer EN-Seiten-
// Locale DE bleibt. Die anderen Tests in dieser Datei mocken
// `getLayerMethodology` komplett weg (`vi.fn()`) und könnten ein
// versehentliches Locale-Durchreichen deshalb nicht bemerken.
describe('mountWebMcpServer · getLayerMethodology bleibt DE (Boundary i18n Block C2)', () => {
	it('deps.getLayerMethodology liefert DE, auch wenn die Seiten-Locale "en" ist', async () => {
		vi.doUnmock('$lib/data/layer-methodology');
		vi.doUnmock('$lib/paraglide/runtime');
		vi.resetModules();
		hoisted.registerWebMcpServer.mockReset();

		const handle = makeHandle();
		let capturedDeps: { getLayerMethodology: (slug: string) => unknown } | undefined;
		hoisted.registerWebMcpServer.mockImplementation(async (deps) => {
			capturedDeps = deps as typeof capturedDeps;
			return handle;
		});

		try {
			const { overwriteGetLocale } = await import('$lib/paraglide/runtime');
			overwriteGetLocale(() => 'en');

			const { mountWebMcpServer } = await importMount();
			await mountWebMcpServer();

			expect(capturedDeps).toBeDefined();
			const laerm = capturedDeps!.getLayerMethodology('laerm-2023') as {
				calculation?: string;
				authority?: string;
			} | null;
			expect(laerm?.calculation).toMatch(/Gesamtverkehrslärm aus Straßen-/);
			expect(laerm?.calculation).not.toMatch(/Total traffic noise from road/);

			overwriteGetLocale(() => 'de');
		} finally {
			vi.doMock('$lib/data/layer-methodology', () => ({ getLayerMethodology: vi.fn() }));
			vi.doMock('$lib/paraglide/runtime', () => ({ getLocale: () => 'de' }));
			vi.resetModules();
		}
	});
});
