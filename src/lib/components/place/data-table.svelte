<script lang="ts">
	interface Props {
		caption: string;
		head: readonly string[];
		rows: readonly (readonly string[])[];
		/** `false`: nur für Screenreader (Lesart „Erzählen“), `true`: sichtbar (Lesart „Zahlen“). */
		visible: boolean;
	}
	let { caption, head, rows, visible }: Props = $props();
</script>

<div class={visible ? 'overflow-x-auto' : 'sr-only'} data-place-table>
	<!-- Zellstile stehen in place.css (.place-dt): spart bei rund 200 Zellen je Seite Markup. -->
	<table class="place-dt w-full border-collapse text-left text-dense-value tabular-nums">
		<caption class="mb-2 text-left text-dense-label text-ink-subtle">{caption}</caption>
		<thead>
			<tr class="head">
				{#each head as h, i (i)}
					<th scope="col">{h}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, r (r)}
				<tr>
					{#each row as cell, i (i)}
						{#if i === 0}
							<th scope="row">{cell}</th>
						{:else}
							<td>{cell}</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
