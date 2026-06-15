/**
 * WebMCP-Prompt-Template: lokalisierte Templates mit Argumenten.
 *
 * Konvention:
 * - `name`: snake_case-Slug, eindeutig
 * - `arguments[]`: snake_case Param-Namen
 * - `render(args, locale)`: liefert finalen Prompt-String inkl. Tool-Hints
 */

export type PromptLocale = 'de' | 'en';

export interface PromptArgumentDescriptor {
	readonly name: string;
	readonly description: string;
	readonly required: boolean;
}

export interface PromptTemplate {
	readonly name: string;
	readonly description: string;
	readonly arguments: readonly PromptArgumentDescriptor[];
	readonly render: (args: Record<string, string | undefined>, locale: PromptLocale) => string;
}
