<script lang="ts">
	type Props = {
		variant?: 'overlay' | 'inline';
	};
	let { variant = 'overlay' }: Props = $props();
</script>

<p
	data-testid="map-attribution"
	class={[
		'pointer-events-auto font-sans text-[10px] text-ink-muted',
		variant === 'overlay' &&
			'absolute bottom-1 right-1 z-10 mix-blend-multiply [text-shadow:0_0_2px_var(--bg),0_0_4px_var(--bg)]',
		variant === 'inline' && 'mt-2 px-2'
	]
		.filter(Boolean)
		.join(' ')}
>
	<a
		href="https://openfreemap.org/"
		target="_blank"
		rel="noopener"
		class="underline-offset-2 hover:underline"
	>
		OpenFreeMap
	</a>
	© <a
		href="https://openmaptiles.org/"
		target="_blank"
		rel="noopener"
		class="underline-offset-2 hover:underline">OpenMapTiles</a
	>
	&
	<a
		href="https://www.openstreetmap.org/copyright"
		target="_blank"
		rel="noopener"
		class="underline-offset-2 hover:underline">OpenStreetMap-Contributors</a
	>
</p>
