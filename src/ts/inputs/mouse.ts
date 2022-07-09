import { Input } from "./input";

export class Mouse implements Input {
    private x = 0;
    private y = 0;

    private dx = 0;
    private dy = 0;

    private dxToCenter = 0;
    private dyToCenter = 0;

    private deadAreaRadius = 100;

    constructor(deadAreaRadius = 100) {
        window.addEventListener("mousemove", e => {
            this.dx = (e.x - this.x) / window.innerWidth;
            this.dy = (e.y - this.y) / window.innerHeight;

            this.x = e.x;
            this.y = e.y;

            this.dxToCenter = e.x - window.innerWidth / 2;
            this.dyToCenter = e.y - window.innerHeight / 2;

            if (this.dxToCenter ** 2 + this.dyToCenter ** 2 < this.deadAreaRadius ** 2) {
                this.dxToCenter = 0;
                this.dyToCenter = 0;
            }

            this.deadAreaRadius = deadAreaRadius;
        });
    }

    getRoll() {
        return 0;
    }

    getPitch() {
        const greaterLength = Math.max(window.innerWidth, window.innerHeight);
        return this.dyToCenter / (greaterLength / 2);
    }

    getYaw() {
        const greaterLength = Math.max(window.innerWidth, window.innerHeight);
        return this.dxToCenter / (greaterLength / 2);
    }

    getZAxis() {
        return 0;
    }

    getXAxis() {
        return 0;
    }

    getYAxis() {
        return 0;
    }

    public getDXToCenter(): number {
        return this.dxToCenter;
    }

    public getDYToCenter(): number {
        return this.dyToCenter;
    }

    public getDeadAreaRadius() {
        return this.deadAreaRadius;
    }

    public setDeadAreaRadius(newDeadAreaRadius: number) {
        this.deadAreaRadius = newDeadAreaRadius;
    }

    getAcceleration(): number {
        return 0;
    }
}
