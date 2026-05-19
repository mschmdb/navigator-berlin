import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerWebMcpServer, type WebMcpServerConfig } from './adapter.js';
import { WEBMCP_SPEC_VERSION } from './internal/spec-version.js';

interface FakeModelContext {
	registered: Array<{ name: string; description: string }>;
	registerTool(tool: {
		name: string;
		description?: string;
		execute: (args: unknown) => Promise<unknown>;
	}): void;
}

function makeFakeNavigator(): {
	navigator: { modelContext: FakeModelContext };
	mc: FakeModelContext;
} {
	const mc: FakeModelContext = {
		registered: [],
		registerTool(tool) {
			this.registered.push({
				name: tool.name,
				description: tool.description ?? ''
			});
		}
	};
	return { navigator: { modelContext: mc }, mc };
}

let cleanup: () => void = () => undefined;

beforeEach(() => {
	cleanup = () => undefined;
});

afterEach(() => {
	cleanup();
});

describe('registerWebMcpServer', () => {
	it('registriert 9 Tools auf navigator.modelContext', async () => {
		const { navigator, mc } = makeFakeNavigator();
		const config = stubConfig(navigator);
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(mc.registered.map((t) => t.name).sort()).toEqual(
			[
				'address_lookup',
				'compare_elections',
				'cross_layer_query',
				'get_election_result',
				'get_kiez_profile',
				'get_layer_metadata',
				'get_voting_district_geometry',
				'list_elections',
				'list_layers_at_point'
			].sort()
		);
	});

	it('liefert spec_version-getter zurück', async () => {
		const { navigator } = makeFakeNavigator();
		const config = stubConfig(navigator);
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(handle.specVersion).toBe(WEBMCP_SPEC_VERSION);
	});

	it('lädt Polyfill wenn navigator.modelContext fehlt', async () => {
		const incompleteNavigator: { modelContext?: FakeModelContext } = {};
		const polyfillLoader = vi.fn(async () => {
			const fake = makeFakeNavigator();
			incompleteNavigator.modelContext = fake.mc;
		});
		const config: WebMcpServerConfig = {
			navigatorProvider: () => incompleteNavigator as never,
			polyfillLoader,
			geocode: async () => [],
			getLayersAtPoint: async () => [],
			getKiezProfile: async () => {
				throw new Error('not used in registration smoke');
			},
			getLayerMetadata: () => {
				throw new Error('not used in registration smoke');
			},
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de',
			fetchElections: async () => [],
			fetchWahlResultsAtPoint: async () => null,
			fetchVotingDistrictGeometry: async () => null
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(polyfillLoader).toHaveBeenCalled();
	});

	it('lädt KEIN Polyfill wenn navigator.modelContext bereits da ist', async () => {
		const polyfillLoader = vi.fn(async () => undefined);
		const { navigator } = makeFakeNavigator();
		const config: WebMcpServerConfig = {
			...stubConfig(navigator),
			polyfillLoader
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(polyfillLoader).not.toHaveBeenCalled();
	});
});

function stubConfig(navigator: { modelContext: FakeModelContext }): WebMcpServerConfig {
	return {
		navigatorProvider: () => navigator as never,
		polyfillLoader: async () => undefined,
		geocode: async () => [],
		getLayersAtPoint: async () => [],
		getKiezProfile: async () => {
			throw new Error('not used in registration smoke');
		},
		getLayerMetadata: () => {
			throw new Error('not used in registration smoke');
		},
		getLayerMethodology: () => null,
		loadManifest: async () => undefined,
		defaultLocale: () => 'de',
		fetchElections: async () => [],
		fetchWahlResultsAtPoint: async () => null,
		fetchVotingDistrictGeometry: async () => null
	};
}
