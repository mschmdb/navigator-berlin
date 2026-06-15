import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Sheet from './sheet.svelte';

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('sheet.svelte (bottom-sheet variant)', () => {
	it('rendert Trigger', async () => {
		render(Sheet, {
			trigger: snippet('<span>Open Sheet</span>'),
			children: snippet('<p>Body</p>')
		});
		await expect.element(page.getByRole('button', { name: 'Open Sheet' })).toBeInTheDocument();
	});

	it('zeigt Sheet bottom-positioned wenn open=true', async () => {
		render(Sheet, {
			open: true,
			trigger: snippet('<span>T</span>'),
			children: snippet('<p>SheetBody</p>')
		});
		const body = page.getByText('SheetBody');
		await expect.element(body).toBeInTheDocument();
		const content = (await body.element()).closest('[role="dialog"]');
		expect(content?.className).toMatch(/bottom-0/);
		expect(content?.className).toMatch(/inset-x-0/);
		expect(content?.className).toMatch(/max-h-\[40vh\]/);
	});
});
