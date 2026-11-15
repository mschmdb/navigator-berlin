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
	<table class="w-full border-collapse text-left text-dense-value tabular-nums">
		<caption class="mb-2 text-left text-dense-label text-ink-subtle">{caption}</caption>
		<thead>
			<tr class="border-b border-rule-strong">
				{#each head as h, i (i)}
					<th scope="col" class="py-1.5 pr-3 font-semibold {i > 0 ? 'text-right' : ''}">{h}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, r (r)}
				<tr class="border-b border-rule">
					{#each row as cell, i (i)}
						{#if i === 0}
							<th scope="row" class="py-1.5 pr-3 font-normal">{cell}</th>
						{:else}
							<td class="py-1.5 pr-3 text-right">{cell}</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
