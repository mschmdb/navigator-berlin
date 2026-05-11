<script lang="ts">
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';
</script>

<section class="mx-auto max-w-[1440px] px-4 py-6">
	<h1 class="mb-4 font-serif text-2xl text-ink">Map-Style Side-by-Side</h1>
	<p class="mb-6 text-base text-ink-muted">
		Links: navigator.berlin Plex-Cartography. Rechts: OpenFreeMap Liberty (Default).
	</p>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div>
			<h2 class="mb-2 text-sm text-ink-muted">Plex (navigator.berlin)</h2>
			<div class="h-[60vh] border border-rule">
				<MapLibreCanvas styleUrl="/map-style.json" />
			</div>
		</div>
		<div>
			<h2 class="mb-2 text-sm text-ink-muted">OpenFreeMap Liberty (Vergleich)</h2>
			<div class="h-[60vh] border border-rule">
				<MapLibreCanvas styleUrl="https://tiles.openfreemap.org/styles/liberty" />
			</div>
		</div>
	</div>
</section>
