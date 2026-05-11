<script lang="ts">
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';

	function onMoveEnd(viewport: {
		center: [number, number];
		zoom: number;
		bbox: [number, number, number, number];
	}) {
		// TODO Story 1.7: URL-State-Sync (?bbox=&zoom=&center=)
		void viewport;
	}

	function onClick(lngLat: [number, number]) {
		// TODO Story 1.7+: getLayersAtPoint(lngLat) → InspectorPanel
		void lngLat;
	}
</script>

<section class="flex h-[calc(100vh-120px)] flex-col">
	<div class="h-[70vh] w-full">
		<MapLibreCanvas {onMoveEnd} {onClick} />
	</div>
	<aside
		class="flex-1 border-t border-rule bg-bg-elevated p-6 text-ink"
		aria-label="Adress-Inspector"
	>
		<p class="text-base text-ink-muted">
			Inspector-Panel kommt in Story 1.9. Adresse via Header-Suche oder Karten-Klick.
		</p>
	</aside>
</section>
