<script lang="ts" module>
	export interface TableColumn<T> {
		key: string;
		label: string;
		sortable: boolean;
		accessor: (row: T) => string | number;
		format?: (value: string | number) => string;
	}

	export type SortDir = 'asc' | 'desc' | 'none';
</script>

<script lang="ts" generics="T">
	import { Table, ChevronUp, ChevronDown, ArrowUpDown } from '@lucide/svelte';

	type Props = {
		columns: TableColumn<T>[];
		rows: T[];
		caption: string;
		toggleLabel?: string;
		closeLabel?: string;
	};

	let {
		columns,
		rows,
		caption,
		toggleLabel = 'Als Tabelle ansehen',
		closeLabel = 'Tabelle schließen'
	}: Props = $props();

	let open = $state(false);
	let sortKey = $state<string | null>(null);
	let sortDir = $state<SortDir>('none');

	function ariaSort(key: string): 'ascending' | 'descending' | 'none' {
		if (sortKey !== key) return 'none';
		if (sortDir === 'asc') return 'ascending';
		if (sortDir === 'desc') return 'descending';
		return 'none';
	}

	function nextDir(current: SortDir): SortDir {
		if (current === 'none') return 'asc';
		if (current === 'asc') return 'desc';
		return 'none';
	}

	function sortColumn(key: string): void {
		if (sortKey !== key) {
			sortKey = key;
			sortDir = 'asc';
			return;
		}
		sortDir = nextDir(sortDir);
		if (sortDir === 'none') sortKey = null;
	}

	function compare(a: string | number, b: string | number): number {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		return String(a).localeCompare(String(b), 'de');
	}

	const sortedRows = $derived.by(() => {
		if (!sortKey || sortDir === 'none') return rows;
		const col = columns.find((c) => c.key === sortKey);
		if (!col) return rows;
		const sorted = [...rows].sort((a, b) => compare(col.accessor(a), col.accessor(b)));
		return sortDir === 'desc' ? sorted.reverse() : sorted;
	});

	function renderCell(col: TableColumn<T>, row: T): string {
		const raw = col.accessor(row);
		return col.format ? col.format(raw) : String(raw);
	}
</script>

<div class="data-table-alternative">
	<button
		type="button"
		data-testid="table-toggle"
		onclick={() => (open = !open)}
		aria-expanded={open}
		class="inline-flex items-center gap-2 border border-rule px-3 py-1.5 text-sm text-ink hover:bg-bg"
	>
		<Table size={16} aria-hidden="true" />
		{open ? closeLabel : toggleLabel}
	</button>

	{#if open}
		<div class="mt-3 overflow-auto border border-rule">
			<table class="w-full border-collapse text-sm" data-testid="data-table">
				<caption class="px-3 py-2 text-left font-serif text-base text-ink">{caption}</caption>
				<thead class="bg-bg">
					<tr>
						{#each columns as col (col.key)}
							<th
								scope="col"
								data-key={col.key}
								aria-sort={col.sortable ? ariaSort(col.key) : undefined}
								class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
							>
								{#if col.sortable}
									<button
										type="button"
										data-testid={`sort-${col.key}`}
										onclick={() => sortColumn(col.key)}
										class="inline-flex items-center gap-1 text-left hover:underline"
									>
										{col.label}
										{#if sortKey === col.key && sortDir === 'asc'}
											<ChevronUp size={14} aria-hidden="true" />
										{:else if sortKey === col.key && sortDir === 'desc'}
											<ChevronDown size={14} aria-hidden="true" />
										{:else}
											<ArrowUpDown size={14} aria-hidden="true" />
										{/if}
									</button>
								{:else}
									{col.label}
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each sortedRows as row, i (i)}
						<tr class="border-b border-rule/60">
							{#each columns as col (col.key)}
								<td class="px-3 py-2">{renderCell(col, row)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
