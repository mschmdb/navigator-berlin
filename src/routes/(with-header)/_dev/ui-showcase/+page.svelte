<script lang="ts">
	import { Button, Dialog, Skeleton, Tooltip } from '$lib/components/ui';

	let dialogOpen = $state(false);
</script>

<main id="main" class="mx-auto max-w-[1024px] px-4 py-12">
	<header class="mb-8 flex items-baseline gap-3">
		<img src="/logo-mark.svg" alt="" class="h-9 w-9 self-center" />
		<h1 class="font-sans text-2xl font-light tracking-wide text-ink">navigator.berlin</h1>
	</header>

	<p class="mb-8 max-w-[64ch] text-base text-ink">
		Adressgenaue Multi-Layer-Inspektion für Berlin: Klima, Lärm, Mobilität, Heritage,
		demografische Daten auf einer Karte.
	</p>

	<div class="mb-12 flex flex-wrap items-center gap-3">
		<Button variant="primary">{#snippet children()}Primary{/snippet}</Button>
		<Button variant="secondary">{#snippet children()}Secondary{/snippet}</Button>
		<Button variant="tertiary">{#snippet children()}Tertiary{/snippet}</Button>

		<Dialog bind:open={dialogOpen}>
			{#snippet trigger()}
				<span
					class="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border border-rule-strong px-4 py-2 text-base text-ink hover:bg-bg-elevated"
				>Dialog öffnen</span>
			{/snippet}
			{#snippet children()}
				<h2 class="mb-2 font-serif text-2xl text-ink">Dialog-Beispiel</h2>
				<p class="text-ink-muted">Kein Overlay-Dimmer (UX-DR33). Heading + Schrift trennen Figur/Grund.</p>
			{/snippet}
		</Dialog>

		<Tooltip>
			{#snippet trigger()}
				<span class="cursor-help text-accent underline-offset-2 hover:underline">Hover für Tooltip</span>
			{/snippet}
			{#snippet children()}
				Inline-Hinweis im Plex-Mini-Style
			{/snippet}
		</Tooltip>
	</div>

	<div class="mb-12">
		<h2 class="mb-3 font-serif text-2xl text-ink">Skeleton-Block</h2>
		<Skeleton class="h-6 w-3/4" />
		<div class="h-2"></div>
		<Skeleton class="h-6 w-1/2" />
	</div>

	<div class="mb-12">
		<h2 class="mb-3 font-serif text-2xl text-ink">Code (Plex Mono)</h2>
		<pre class="border border-rule p-3 font-mono text-sm text-ink"><code>const navigator = 'berlin';</code></pre>
		<p class="tabular mt-3 text-base">Tabular: 1234567890 · 12.345,67 €</p>
	</div>

	<div class="grid gap-2">
		<h2 class="mb-2 font-serif text-2xl text-ink">Text-Skalen</h2>
		<p class="text-xs">text-xs :kleinste Skala für Footer + Meta</p>
		<p class="text-sm">text-sm :Captions, Sekundär-Info</p>
		<p class="text-base">text-base :Body-Text Default</p>
		<p class="text-lg">text-lg :Lead-Paragraphen</p>
		<p class="text-xl">text-xl :h4-Level</p>
		<p class="text-2xl">text-2xl :h3-Level</p>
		<p class="text-3xl">text-3xl :h2-Level</p>
		<p class="text-4xl">text-4xl :h1-Level (auf Mobile = text-2xl)</p>
	</div>
</main>
