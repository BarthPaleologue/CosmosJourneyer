export function wheelOfFortune<T>(options: [T, number][], randomValue: number): T {
    const total = options.reduce((acc, [, weight]) => acc + weight, 0);
    const choice = randomValue * total;
    let current = 0;
    for (const [option, weight] of options) {
        current += weight;
        if (choice < current) return option;
    }
    throw new Error("Wheel of fortune failed");
}

export function uniformToExponential(uniformValue: number, lambda: number) {
    return -Math.log(uniformValue) / lambda;
}

export function randomPieChart(nbSlices: number, rng: (index: number) => number, baseIndex: number): number[] {
    const results = [];
    let sum = 0.0;
    for (let i = 0; i < nbSlices; i++) {
        const exponentialComponent = uniformToExponential(rng(baseIndex + i), 1.0);
        results.push(exponentialComponent);
        sum += exponentialComponent;
    }

    return results.map((result) => result / sum);
}
