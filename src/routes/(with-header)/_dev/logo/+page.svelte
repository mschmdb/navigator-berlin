<script lang="ts">
	import { AnimatedLogo } from '$lib/components/ui';
	import { ANCHOR_POINTS, BOUNDARY_POINTS, DELAUNAY_EDGES } from '$lib/data/logo-geometry';

	let replayKey = $state(0);
</script>

<section class="mx-auto max-w-[1280px] px-4 py-12">
	<h1 class="mb-2 font-serif text-3xl text-ink">Logo-Showcase</h1>
	<p class="mb-8 text-base text-ink-muted">
		Visuelle Verifikation der drei statischen Varianten + animierter Loader-Komponente.
		Geometrie: {BOUNDARY_POINTS.length} Boundary-Punkte, {ANCHOR_POINTS.length} innere Vermessungs-Stützpunkte,
		{DELAUNAY_EDGES.length} Delaunay-Kanten. Quelle: bezirke.geojson → Douglas-Peucker → Delaunay.
	</p>

	<h2 class="mb-4 mt-10 font-mono text-xs uppercase tracking-wider text-ink-muted">
		Statische SVG-Files
	</h2>
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<figure class="border border-rule p-4">
			<img src="/logo-mark.svg" alt="Master-Variante" class="mx-auto h-48 w-48" />
			<figcaption class="mt-3 font-mono text-xs text-ink-muted">
				Master · 192×192 · /logo-mark.svg
			</figcaption>
		</figure>
		<figure class="border border-rule p-4">
			<img src="/logo-mark-header.svg" alt="Header-Variante" class="mx-auto h-12 w-12" />
			<figcaption class="mt-3 font-mono text-xs text-ink-muted">
				Header · 48×48 · /logo-mark-header.svg
			</figcaption>
		</figure>
		<figure class="border border-rule p-4">
			<img src="/favicon.svg" alt="Favicon" class="mx-auto h-8 w-8" />
			<img src="/favicon.svg" alt="Favicon" class="mx-auto mt-3 h-4 w-4" />
			<figcaption class="mt-3 font-mono text-xs text-ink-muted">
				Favicon · 32 + 16 px · /favicon.svg
			</figcaption>
		</figure>
	</div>

	<h2 class="mb-4 mt-12 font-mono text-xs uppercase tracking-wider text-ink-muted">
		Animierte Komponente: one-shot
	</h2>
	<p class="mb-4 max-w-prose text-sm text-ink-muted">
		Build-Sequenz: Boundary draw-on, dann Datenpunkte staggered, dann innere Delaunay-Kanten,
		Anchor-Stützpunkte zuletzt. Bleibt final stehen. Für Page-Load oder Hero-Bereich.
	</p>
	<div class="flex items-center gap-6 border border-rule p-6">
		{#key replayKey}
			<AnimatedLogo variant="one-shot" size={192} />
		{/key}
		<button
			type="button"
			onclick={() => (replayKey += 1)}
			class="border border-rule px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-bg-elevated"
		>
			Replay
		</button>
	</div>

	<h2 class="mb-4 mt-12 font-mono text-xs uppercase tracking-wider text-ink-muted">
		Animierte Komponente: loop (Loader)
	</h2>
	<p class="mb-4 max-w-prose text-sm text-ink-muted">
		Endlos-Cycle für Loading-States. Boundary baut auf, Punkte erscheinen, Linien zeichnen,
		alles fadet wieder, Cycle wiederholt. role="status" + aria-live="polite" mit
		visually-hidden Label für Screenreader.
	</p>
	<div class="flex items-center gap-12 border border-rule p-6">
		<AnimatedLogo variant="loop" size={192} loadingLabel="Karte wird geladen" />
		<AnimatedLogo variant="loop" size={64} loadingLabel="Adresse wird gesucht" />
		<AnimatedLogo variant="loop" size={32} loadingLabel="Lädt" />
	</div>

	<h2 class="mb-4 mt-12 font-mono text-xs uppercase tracking-wider text-ink-muted">
		Header-Kontext (32 px wie im Site-Header)
	</h2>
	<div class="flex items-center gap-3 border border-rule p-4">
		<img src="/logo-mark-header.svg" alt="" class="h-8 w-8" />
		<span class="font-sans text-base font-light tracking-wide text-ink">navigator.berlin</span>
	</div>

	<h2 class="mb-4 mt-12 font-mono text-xs uppercase tracking-wider text-ink-muted">
		Reduced-Motion Verhalten
	</h2>
	<p class="max-w-prose text-sm text-ink-muted">
		System-Setting <code class="font-mono">prefers-reduced-motion: reduce</code> aktivieren
		(macOS: Systemeinstellungen → Bedienungshilfen → Anzeige → Bewegung reduzieren). Die
		Komponente zeigt dann sofort den Final-State ohne Animation, Loop-Variante steht still.
	</p>
</section>
