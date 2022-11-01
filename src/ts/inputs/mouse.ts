import { Input, InputType } from "./input";

export class Mouse implements Input {
    readonly type = InputType.MOUSE;

    private x = 0;
    private y = 0;

    private dx = 0;
    private dy = 0;

    private dxToCenter = 0;
    private dyToCenter = 0;

    deadAreaRadius = 100;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, deadAreaRadius = 50) {
        this.deadAreaRadius = deadAreaRadius;
        this.canvas = canvas;

        this.canvas.addEventListener("mousemove", (e) => {
            this.dx = (e.x - this.x) / this.canvas.width;
            this.dy = (e.y - this.y) / this.canvas.height;

            this.x = e.x;
            this.y = e.y;

            this.dxToCenter = e.x - this.canvas.width / 2;
            this.dyToCenter = e.y - this.canvas.height / 2;
        });
    }

    getRoll() {
        return 0;
    }

    getPitch() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return (this.dyToCenter * adaptedLength) / (greaterLength / 2);
    }

    getYaw() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return (this.dxToCenter * adaptedLength) / (greaterLength / 2);
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

    getAcceleration(): number {
        return 0;
    }

    getDx(): number {
        return this.dx;
    }

    getDy(): number {
        return this.dy;
    }
}
