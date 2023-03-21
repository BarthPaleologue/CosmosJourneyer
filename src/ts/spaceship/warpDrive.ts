export class WarpDrive {
    private throttle = 0;

    getThrottle(): number {
        return this.throttle;
    }

    setThrottle(throttle: number): void {
        this.throttle = Math.max(0, Math.min(1, throttle));
    }
}