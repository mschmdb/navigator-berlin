type YearField = 'count' | 'temp';

type RollingInput<F extends YearField> = { year: number } & { [K in F]: number };

export function rollingMean<F extends YearField>(
	series: readonly RollingInput<F>[],
	window: number,
	field: F
): RollingInput<F>[] {
	if (window <= 0) throw new Error('rollingMean: window must be > 0');
	if (series.length < window) return [];

	const out: RollingInput<F>[] = [];
	let runningSum = 0;
	for (let i = 0; i < window; i++) runningSum += series[i][field];

	const firstYear = series[window - 1].year;
	out.push({ year: firstYear, [field]: runningSum / window } as RollingInput<F>);

	for (let i = window; i < series.length; i++) {
		runningSum += series[i][field] - series[i - window][field];
		out.push({ year: series[i].year, [field]: runningSum / window } as RollingInput<F>);
	}

	return out;
}
