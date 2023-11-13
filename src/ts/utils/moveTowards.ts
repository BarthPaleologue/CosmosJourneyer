export function moveTowards(x: number, target: number, rate: number): number {
    if (x > target) {
        return Math.max(target, x - rate);
    }
    return Math.min(target, x + rate);
}
