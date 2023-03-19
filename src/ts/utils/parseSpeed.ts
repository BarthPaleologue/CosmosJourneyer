export function parseSpeed(speed: number): string {
    if (speed < 1000) {
        return `${speed.toFixed(0)} m/s`;
    } else if (speed < 1000000) {
        return `${(speed / 1000).toFixed(2)} km/s`;
    } else if (speed < 100000000) {
        return `${(speed / 1000000).toFixed(2)} Mm/s`;
    } else {
        return `${(speed / 299792458).toFixed(2)} c`;
    }
}