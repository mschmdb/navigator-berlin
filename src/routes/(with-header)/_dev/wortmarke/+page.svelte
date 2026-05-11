<script lang="ts">
	const candidates = [
		{ id: 'A', family: 'sans', weight: 300, tracking: '0' },
		{ id: 'B', family: 'sans', weight: 200, tracking: '0' },
		{ id: 'C', family: 'sans', weight: 300, tracking: '0.02em' },
		{ id: 'D', family: 'sans', weight: 200, tracking: '0.04em' },
		{ id: 'E', family: 'serif', weight: 300, tracking: '0' },
		{ id: 'F', family: 'sans', weight: 100, tracking: '0' }
	];
	const sizes = [16, 24, 28];
</script>

<section class="mx-auto max-w-[1024px] px-4 py-12">
	<h1 class="mb-6 font-serif text-3xl text-ink">Wortmarke: 6 Plex-Kandidaten</h1>
	<p class="mb-8 text-base text-ink-muted">
		Visual-Test der 6 Plex-Schnitte aus Logo-Spec. Aktuelle Default-Entscheidung: Kandidat C (Plex
		Sans Light 300, tracking 0.02em). Re-Run nach Decision-Review jederzeit moeglich.
	</p>

	{#each candidates as c (c.id)}
		<section class="mb-10 border-t border-rule pt-6">
			<h2 class="mb-3 text-sm text-ink-muted">
				Kandidat {c.id}: Plex {c.family}
				{c.weight} / tracking {c.tracking}
			</h2>
			{#each sizes as size (size)}
				<p
					style="font-family: var(--font-{c.family}); font-weight: {c.weight}; letter-spacing: {c.tracking}; font-size: {size}px;"
					class="text-ink"
				>
					navigator.berlin
				</p>
			{/each}
		</section>
	{/each}
</section>
