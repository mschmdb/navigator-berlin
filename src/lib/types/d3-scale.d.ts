declare module 'd3-scale' {
	export interface ScaleLinear<Range, Output> {
		(value: number): Output;
		invert(value: number): number;
		domain(): [number, number];
		domain(domain: Iterable<number>): this;
		range(): [Range, Range];
		range(range: Iterable<Range>): this;
		clamp(): boolean;
		clamp(clamp: boolean): this;
		copy(): this;
		ticks(count?: number): number[];
	}

	export function scaleLinear<Range = number, Output = Range>(): ScaleLinear<Range, Output>;
}
