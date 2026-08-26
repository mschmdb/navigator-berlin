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
	it('registriert 11 Tools auf navigator.modelContext', async () => {
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
				'list_layers_at_point',
				'set_finder_weights',
				'get_finder_state'
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
			fetchVotingDistrictGeometry: async () => null,
			applyFinderWeights: async () => {
				throw new Error('not used in registration smoke');
			},
			readFinderState: () => {
				throw new Error('not used in registration smoke');
			}
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(polyfillLoader).toHaveBeenCalled();
	});

	// WebMCP-Challenge 26.08.: die Spec ist von navigator.modelContext zu
	// document.modelContext gewandert (ChatGPT-Browser, Chrome 149). Der
	// Adapter bevorzugt document und fällt auf navigator + Polyfill zurück.
	// Spec-Konformität (IDL 26.08.): registerTool liefert Promise<undefined>,
	// der Adapter muss die Annahme ABWARTEN; ToolAnnotations.readOnlyHint
	// steuert ChatGPTs Safety-Review.
	it('wartet asynchrone registerTool-Aufrufe ab und propagiert Fehler', async () => {
		let aufgeloest = 0;
		const mc = {
			registered: [] as Array<{ name: string }>,
			registerTool(tool: { name: string }) {
				this.registered.push({ name: tool.name });
				return new Promise<void>((resolve) => {
					setTimeout(() => {
						aufgeloest += 1;
						resolve();
					}, 1);
				});
			}
		};
		const handle = await registerWebMcpServer(stubConfig({ modelContext: mc as never }));
		cleanup = () => handle.unregister();
		expect(aufgeloest).toBe(11);
	});

	it('reicht readOnlyHint-Annotations an registerTool durch', async () => {
		const annotationen: Record<string, unknown> = {};
		const mc = {
			registered: [] as unknown[],
			registerTool(tool: { name: string; annotations?: { readOnlyHint?: boolean } }) {
				annotationen[tool.name] = tool.annotations?.readOnlyHint;
				this.registered.push(tool);
			}
		};
		const handle = await registerWebMcpServer(stubConfig({ modelContext: mc as never }));
		cleanup = () => handle.unregister();
		expect(annotationen['address_lookup']).toBe(true);
		expect(annotationen['get_finder_state']).toBe(true);
		expect(annotationen['set_finder_weights']).toBe(false);
	});

	it('meldet im Handle Surface und Polyfill-Status', async () => {
		const { navigator } = makeFakeNavigator();
		const handle = await registerWebMcpServer(stubConfig(navigator));
		cleanup = () => handle.unregister();
		expect(handle.surface).toBe('navigator');
		expect(handle.viaPolyfill).toBe(false);
	});

	it('meldet surface document, wenn document.modelContext trägt', async () => {
		const dokument = makeFakeNavigator();
		const handle = await registerWebMcpServer({
			...stubConfig(makeFakeNavigator().navigator),
			documentProvider: () => dokument.navigator as never
		});
		cleanup = () => handle.unregister();
		expect(handle.surface).toBe('document');
	});

	it('meldet viaPolyfill true, wenn erst der Polyfill die API stellt', async () => {
		const nav: { modelContext?: FakeModelContext } = {};
		const handle = await registerWebMcpServer({
			...stubConfig({ modelContext: undefined as never }),
			navigatorProvider: () => nav as never,
			polyfillLoader: async () => {
				nav.modelContext = makeFakeNavigator().mc;
			}
		});
		cleanup = () => handle.unregister();
		expect(handle.viaPolyfill).toBe(true);
		expect(handle.surface).toBe('navigator');
	});

	it('bevorzugt document.modelContext, wenn vorhanden', async () => {
		const dokument = makeFakeNavigator();
		const alt = makeFakeNavigator();
		const config: WebMcpServerConfig = {
			...stubConfig(alt.navigator),
			documentProvider: () => dokument.navigator as never
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(dokument.mc.registered.length).toBe(11);
		expect(alt.mc.registered.length).toBe(0);
	});

	it('fällt auf navigator.modelContext zurück, wenn document keine API hat', async () => {
		const { navigator, mc } = makeFakeNavigator();
		const config: WebMcpServerConfig = {
			...stubConfig(navigator),
			documentProvider: () => ({}) as never
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(mc.registered.length).toBe(11);
	});

	it('findet document.modelContext auch, wenn erst der Polyfill es bereitstellt', async () => {
		const dokument: { modelContext?: FakeModelContext } = {};
		const nav: { modelContext?: FakeModelContext } = {};
		const polyfillLoader = vi.fn(async () => {
			dokument.modelContext = makeFakeNavigator().mc;
		});
		const config: WebMcpServerConfig = {
			...stubConfig({ modelContext: undefined as never }),
			navigatorProvider: () => nav as never,
			documentProvider: () => dokument as never,
			polyfillLoader
		};
		const handle = await registerWebMcpServer(config);
		cleanup = () => handle.unregister();
		expect(polyfillLoader).toHaveBeenCalled();
		expect(dokument.modelContext?.registered.length).toBe(11);
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
		fetchVotingDistrictGeometry: async () => null,
		applyFinderWeights: async () => {
			throw new Error('not used in registration smoke');
		},
		readFinderState: () => {
			throw new Error('not used in registration smoke');
		}
	};
}
