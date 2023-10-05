import { Observable } from "@babylonjs/core/Misc/observable";
import { clamp } from "../../utils/math";
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

    readonly onMouseEnterObservable: Observable<void> = new Observable();
    readonly onMouseLeaveObservable: Observable<void> = new Observable();

    constructor(canvas: HTMLCanvasElement, deadAreaRadius = 50) {
        this.deadAreaRadius = deadAreaRadius;
        this.canvas = canvas;

        document.addEventListener("mousemove", (e) => {
            this.dx = (e.x - this.x) / this.canvas.width;
            this.dy = (e.y - this.y) / this.canvas.height;

            this.x = e.x;
            this.y = e.y;

            this.dxToCenter = e.x - this.canvas.width / 2;
            this.dyToCenter = e.y - this.canvas.height / 2;
        });

        document.addEventListener("mouseenter", () => {
            this.onMouseEnterObservable.notifyObservers();
        });
        document.addEventListener("mouseleave", () => {
            this.onMouseLeaveObservable.notifyObservers();
        });
    }

    getRoll() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return clamp((this.dxToCenter * adaptedLength) / (greaterLength / 2), -1, 1);
    }

    getPitch() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return clamp((this.dyToCenter * adaptedLength) / (greaterLength / 2), -1, 1);
    }

    getYaw() {
        return 0;
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
