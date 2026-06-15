import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Combobox from './combobox.svelte';
import Popover from './popover.svelte';
import Tooltip from './tooltip.svelte';
import ToggleGroup from './toggle-group.svelte';
import ScrollArea from './scroll-area.svelte';
import Tabs from './tabs.svelte';
import AlertDialog from './alert-dialog.svelte';
import Disclosure from './disclosure.svelte';

const snip = (html = '<span>x</span>') => createRawSnippet(() => ({ render: () => html }));

const assertMounted = (result: { unmount: () => void }) => {
	expect(result.unmount).toBeTypeOf('function');
};

describe('pure-style wrapper smoke (8 components)', () => {
	it('Combobox mountet', () => {
		assertMounted(render(Combobox, { children: snip('<div/>') }));
	});

	it('Popover mountet', () => {
		assertMounted(
			render(Popover, { trigger: snip('<span>Trig</span>'), children: snip('<p>Body</p>') })
		);
	});

	it('Tooltip mountet', () => {
		assertMounted(
			render(Tooltip, { trigger: snip('<span>Trig</span>'), children: snip('<p>Body</p>') })
		);
	});

	it('ToggleGroup mountet', () => {
		assertMounted(render(ToggleGroup, { children: snip('<span/>') }));
	});

	it('ScrollArea mountet', () => {
		assertMounted(render(ScrollArea, { children: snip('<div>Long</div>') }));
	});

	it('Tabs mountet', () => {
		assertMounted(render(Tabs, { value: 'a', children: snip('<div/>') }));
	});

	it('AlertDialog mountet', () => {
		assertMounted(
			render(AlertDialog, { trigger: snip('<span>T</span>'), children: snip('<p>Body</p>') })
		);
	});

	it('Disclosure mountet', () => {
		assertMounted(render(Disclosure, { value: '', children: snip('<div/>') }));
	});
});
