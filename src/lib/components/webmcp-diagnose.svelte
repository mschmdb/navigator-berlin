<!--
	Live-Diagnose der WebMCP-Registrierung auf /webmcp (Challenge 2026).
	Zeigt ohne DevTools (ChatGPT-In-App-Browser!), welche API-Surface der
	Browser bereitstellt, ob der Polyfill einsprang und welche Tools
	registriert sind. mountWebMcpServer ist idempotent: der Aufruf hier
	liefert das Handle des Layout-Mounts zurück.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebMcpServerHandle } from '$lib/webmcp/adapter.js';

	let handle = $state<WebMcpServerHandle | null>(null);
	let fehler = $state<string | null>(null);
	let hatDocumentApi = $state<boolean | null>(null);
	let hatNavigatorApi = $state<boolean | null>(null);

	onMount(async () => {
		try {
			const { mountWebMcpServer } = await import('$lib/webmcp/mount.js');
			handle = await mountWebMcpServer();
		} catch (e) {
			if (e instanceof Error) {
				fehler = e.message;
			} else {
				try {
					fehler = JSON.stringify(e);
				} catch {
					fehler = String(e);
				}
			}
		}
		// Zustand NACH dem Mount: bei viaPolyfill=true stammt die Surface
		// vom Polyfill, nicht vom Browser.
		hatDocumentApi = 'modelContext' in document;
		hatNavigatorApi = 'modelContext' in (globalThis.navigator ?? {});
	});
</script>

<section class="mt-10" data-testid="webmcp-diagnose">
	<h2 class="font-serif text-xl">Live-Diagnose in diesem Browser</h2>
	<p class="text-fg-muted mt-3 leading-relaxed">
		Dieser Abschnitt prüft beim Laden, was der Browser gerade bereitstellt. English: live check of
		the WebMCP surface in your current browser.
	</p>
	{#if fehler}
		<p class="mt-4 font-mono text-sm text-red-700" data-testid="webmcp-diagnose-fehler">
			Registration failed: {fehler}
		</p>
	{:else if handle === null}
		<p class="mt-4 font-mono text-sm" data-testid="webmcp-diagnose-laedt">checking…</p>
	{:else}
		<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-sm">
			<dt>document.modelContext</dt>
			<dd data-testid="webmcp-diagnose-document">
				{hatDocumentApi ? 'available' : 'not available'}
			</dd>
			<dt>navigator.modelContext</dt>
			<dd data-testid="webmcp-diagnose-navigator">
				{hatNavigatorApi ? 'available' : 'not available'}
			</dd>
			<dt>registered on</dt>
			<dd data-testid="webmcp-diagnose-surface">
				{handle.surface}.modelContext{handle.viaPolyfill
					? ' · via @mcp-b/global polyfill'
					: ' · native'}
			</dd>
			<dt>spec version</dt>
			<dd>{handle.specVersion}</dd>
			<dt>tools ({handle.toolNames.length})</dt>
			<dd data-testid="webmcp-diagnose-tools" class="break-words">
				{handle.toolNames.join(' · ')}
			</dd>
		</dl>
	{/if}
</section>
