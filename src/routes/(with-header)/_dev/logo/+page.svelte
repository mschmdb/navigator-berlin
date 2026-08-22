<script lang="ts">
	import { PixelLogo } from '$lib/components/ui';
	import { buildGeometry, PALETTE, PRESET } from '$lib/data/pixel-logo-geometry';

	const cells = buildGeometry(PRESET).cells.length;

	const SIZES = [240, 128, 96, 64, 48, 32] as const;

	let replayKey = $state(0);
</script>

<section class="mx-auto max-w-[1280px] px-4 py-12">
	<h1 class="mb-2 font-serif text-3xl text-ink">Logo-Showcase</h1>
	<p class="mb-8 max-w-prose text-base text-ink-muted">
		Berlin-Silhouette als Raster aus Farbquadraten. Die Farben sind Dekoration, sie stellen keine
		Daten dar und tragen keine Bedeutung. Ein Raster für alle Größen: {PRESET.grid}×{PRESET.grid} mit
		{cells} Zellen, Fugen {PRESET.gap} %, Ecken {PRESET.round} %, Kanten-Schwelle {PRESET.threshold} %.
		Palette: {PALETTE.length} Farben, Seed {PRESET.seed}.
	</p>

	<h2 class="mt-10 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Statische SVG-Files
	</h2>
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<figure class="border border-rule p-4">
			<img src="/logo-pixel.svg" alt="Master-Variante" class="mx-auto h-48 w-48" />
			<figcaption class="mt-3 font-mono text-xs text-ink-muted">
				Transparent · /logo-pixel.svg
			</figcaption>
		</figure>
		<figure class="border border-rule bg-[#14161F] p-4">
			<img src="/logo-pixel-dark.svg" alt="Variante auf dunklem Grund" class="mx-auto h-48 w-48" />
			<figcaption class="mt-3 font-mono text-xs text-[#ECEAE0]">
				Dunkel · /logo-pixel-dark.svg
			</figcaption>
		</figure>
		<figure class="border border-rule p-4">
			<img src="/favicon.svg" alt="Favicon" class="mx-auto h-8 w-8" />
			<img src="/favicon.svg" alt="" class="mx-auto mt-3 h-4 w-4" />
			<figcaption class="mt-3 font-mono text-xs text-ink-muted">
				Favicon · 32 + 16 px · /favicon.svg
			</figcaption>
		</figure>
	</div>

	<h2 class="mt-12 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Größenreihe · Ruhezustand
	</h2>
	<p class="mb-4 max-w-prose text-sm text-ink-muted">
		Gleiches Raster, nur kleiner gerendert. Im Ruhezustand wechseln elf Zellen alle 150 ms die
		Farbe, jede über 700 ms überblendet. Unter 48 px verliert die Füllung ihre Kontur, dort steht
		die Wortmarke allein.
	</p>
	<div class="flex flex-wrap items-end gap-8 border border-rule p-6">
		{#each SIZES as size (size)}
			<figure class="flex flex-col items-center gap-2">
				<PixelLogo {size} title="" />
				<figcaption class="font-mono text-[10px] text-ink-muted">{size} px</figcaption>
			</figure>
		{/each}
	</div>

	<h2 class="mt-12 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Größenreihe auf dunklem Grund
	</h2>
	<div class="flex flex-wrap items-end gap-8 border border-rule bg-[#14161F] p-6">
		{#each SIZES as size (size)}
			<figure class="flex flex-col items-center gap-2">
				<PixelLogo {size} title="" />
				<figcaption class="font-mono text-[10px] text-[#9a9a94]">{size} px</figcaption>
			</figure>
		{/each}
	</div>

	<h2 class="mt-12 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Loader-Variante
	</h2>
	<p class="mb-4 max-w-prose text-sm text-ink-muted">
		Die Zellen blenden in gestreuter Reihenfolge ein, halten, blenden aus, der Zyklus wiederholt
		sich. Kein Rotieren, kein Spinner. Das SVG ist <code class="font-mono">aria-hidden</code>, den
		Ladezustand meldet ein visually-hidden Text in einem
		<code class="font-mono">role="status"</code>.
	</p>
	<div class="flex flex-wrap items-center gap-12 border border-rule p-6">
		{#key replayKey}
			<PixelLogo variant="loop" size={128} loadingLabel="Karte wird geladen" />
			<PixelLogo variant="loop" size={96} loadingLabel="Adresse wird gesucht" />
			<PixelLogo variant="loop" size={64} loadingLabel="Lädt" />
		{/key}
		<button
			type="button"
			onclick={() => (replayKey += 1)}
			class="border border-rule px-4 py-2 font-mono text-xs tracking-wider text-ink uppercase hover:bg-bg-elevated"
		>
			Replay
		</button>
	</div>

	<h2 class="mt-12 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Header-Kontext · 64 px wie im Site-Header
	</h2>
	<div class="flex items-center gap-2 border border-rule p-4">
		<PixelLogo size={64} title="" />
		<span class="font-sans text-base font-light tracking-wide text-ink">navigator.berlin</span>
	</div>

	<h2 class="mt-12 mb-4 font-mono text-xs tracking-wider text-ink-muted uppercase">
		Reduced-Motion Verhalten
	</h2>
	<p class="max-w-prose text-sm text-ink-muted">
		System-Setting <code class="font-mono">prefers-reduced-motion: reduce</code> aktivieren (macOS: Systemeinstellungen
		→ Bedienungshilfen → Anzeige → Bewegung reduzieren). Dann steht der Farbwechsel still und der Loader
		zeigt das volle Raster, statt mitten im Aufbau einzufrieren.
	</p>
</section>
