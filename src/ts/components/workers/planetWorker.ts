export class PlanetWorker {
    _worker = new Worker(new URL('./workerScript.ts', import.meta.url), { type: "module" });
    constructor() {

    }
    public send(message: any): void {
        this._worker.postMessage(message);
    }
    public getWorker(): Worker {
        return this._worker;
    }
    async listen() {

    }
}