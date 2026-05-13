import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DataTableAlternative from './data-table-alternative.svelte';
import type { TableColumn } from './data-table-alternative.svelte';

interface Row {
	layer: string;
	value: number;
	updated: string;
}

const COLUMNS: TableColumn<Row>[] = [
	{ key: 'layer', label: 'Layer', sortable: true, accessor: (r) => r.layer },
	{ key: 'value', label: 'Wert', sortable: true, accessor: (r) => r.value },
	{ key: 'updated', label: 'Aktualisiert', sortable: false, accessor: (r) => r.updated }
];

const ROWS: Row[] = [
	{ layer: 'Mietspiegel', value: 14.5, updated: '2026-04-01' },
	{ layer: 'Bezirke', value: 3.2, updated: '2026-03-10' },
	{ layer: 'Lärm', value: 65.0, updated: '2026-02-20' }
];

describe('DataTableAlternative', () => {
	it('rendert Toggle-Button per Default geschlossen', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		const toggle = screen.getByTestId('table-toggle');
		await toggle.element();
		expect(screen.container.querySelector('table')).toBeNull();
	});

	it('öffnet Tabelle bei Toggle-Klick', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		const table = screen.container.querySelector('table');
		expect(table).not.toBeNull();
		expect(table?.querySelector('caption')?.textContent).toContain('Layer-Daten');
		const ths = table?.querySelectorAll('th');
		expect(ths?.length).toBe(3);
		ths?.forEach((th) => expect(th.getAttribute('scope')).toBe('col'));
	});

	it('sortable Header haben aria-sort="none" initial', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		const layerHeader = screen.container.querySelector('th[data-key="layer"]');
		expect(layerHeader?.getAttribute('aria-sort')).toBe('none');
	});

	it('Klick auf sortierbaren Header setzt aria-sort="ascending"', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		await screen.getByTestId('sort-layer').click();
		const layerHeader = screen.container.querySelector('th[data-key="layer"]');
		expect(layerHeader?.getAttribute('aria-sort')).toBe('ascending');
		const firstRow = screen.container.querySelectorAll('tbody tr')[0];
		expect(firstRow?.textContent).toContain('Bezirke');
	});

	it('zweiter Klick auf Header toggle auf "descending"', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		await screen.getByTestId('sort-layer').click();
		await screen.getByTestId('sort-layer').click();
		const layerHeader = screen.container.querySelector('th[data-key="layer"]');
		expect(layerHeader?.getAttribute('aria-sort')).toBe('descending');
		const firstRow = screen.container.querySelectorAll('tbody tr')[0];
		expect(firstRow?.textContent).toContain('Mietspiegel');
	});

	it('numerische Werte sortieren als Zahlen, nicht als Strings', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		await screen.getByTestId('sort-value').click();
		const firstRow = screen.container.querySelectorAll('tbody tr')[0];
		expect(firstRow?.textContent).toContain('3.2');
		const lastRow = screen.container.querySelectorAll('tbody tr')[2];
		expect(lastRow?.textContent).toContain('65');
	});

	it('nicht-sortierbare Spalte hat keinen Sort-Button', async () => {
		const screen = render(DataTableAlternative as unknown as typeof DataTableAlternative<Row>, {
			columns: COLUMNS,
			rows: ROWS,
			caption: 'Layer-Daten'
		} as unknown as Parameters<typeof render>[1]);
		await screen.getByTestId('table-toggle').click();
		expect(screen.container.querySelector('[data-testid="sort-updated"]')).toBeNull();
	});
});
