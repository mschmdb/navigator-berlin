export interface RegressionFit {
	slope: number;
	intercept: number;
	predict(x: number): number;
}

export function linearRegression<T>(
	data: readonly T[],
	xAccessor: (d: T) => number,
	yAccessor: (d: T) => number
): RegressionFit {
	if (data.length === 0) {
		return { slope: 0, intercept: 0, predict: () => 0 };
	}
	if (data.length === 1) {
		const y = yAccessor(data[0]);
		return { slope: 0, intercept: y, predict: () => y };
	}

	let sumX = 0;
	let sumY = 0;
	for (const d of data) {
		sumX += xAccessor(d);
		sumY += yAccessor(d);
	}
	const n = data.length;
	const meanX = sumX / n;
	const meanY = sumY / n;

	let num = 0;
	let den = 0;
	for (const d of data) {
		const dx = xAccessor(d) - meanX;
		num += dx * (yAccessor(d) - meanY);
		den += dx * dx;
	}

	const slope = den === 0 ? 0 : num / den;
	const intercept = meanY - slope * meanX;

	return {
		slope,
		intercept,
		predict: (x: number) => slope * x + intercept
	};
}
