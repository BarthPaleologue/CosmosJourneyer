export enum WARPDRIVE_STATE {
    DISABLED,
    ENABLED,
    DESENGAGING
}

export class WarpDrive {
    private throttle = 0;

    private readonly acceleration = 0.02;

    private targetSpeed = 0;

    private currentSpeed = 0;

    private state = WARPDRIVE_STATE.DISABLED;

    enable(): void {
        this.state = WARPDRIVE_STATE.ENABLED;
    }

    desengage(): void {
        this.state = WARPDRIVE_STATE.DESENGAGING;
    }

    getState(): WARPDRIVE_STATE {
        return this.state;
    }

    getThrottle(): number {
        return this.throttle;
    }

    setThrottle(throttle: number): void {
        this.throttle = Math.max(0, Math.min(1, throttle));
    }

    setTargetSpeed(targetSpeed: number): void {
        this.targetSpeed = targetSpeed;
    }

    public computeTargetSpeed(closestDistanceToPlanet: number): number {
        this.targetSpeed = Math.min(closestDistanceToPlanet / 10, (closestDistanceToPlanet / 2e3) ** 2);
        return this.targetSpeed;
    }

    getTargetSpeed(): number {
        return this.targetSpeed;
    }

    public increaseThrottle(delta: number): void {
        this.setThrottle(this.throttle + delta);
    }

    public getAcceleration(): number {
        return this.acceleration;
    }

    public getWarpSpeed(): number {
        return this.currentSpeed;
    }

    public computeWarpDriveSpeed(currentForwardSpeed: number, deltaTime: number): number {
        const currentSpeed = currentForwardSpeed;

        const sign = Math.sign(this.targetSpeed - currentSpeed);

        let deltaThrottle = this.acceleration * deltaTime;
        this.increaseThrottle(deltaThrottle * sign);

        const speed = this.getThrottle() * this.targetSpeed;

        return speed;
    }

    public update(currentForwardSpeed: number, closestDistanceToPlanet: number, deltaTime: number): void {
        switch (this.state) {
            case WARPDRIVE_STATE.DESENGAGING:
                this.targetSpeed *= 0.9;
                this.currentSpeed = this.computeWarpDriveSpeed(currentForwardSpeed, deltaTime);
                if (this.targetSpeed < 1e2 && this.currentSpeed < 1e2) {
                    this.state = WARPDRIVE_STATE.DISABLED;
                }
                break;
            case WARPDRIVE_STATE.ENABLED:
                this.computeTargetSpeed(closestDistanceToPlanet);
                this.currentSpeed = this.computeWarpDriveSpeed(currentForwardSpeed, deltaTime);
                break;
            case WARPDRIVE_STATE.DISABLED:
                this.targetSpeed = 0;
                this.throttle = 0;
                break;
            default:
                break;
        }
    }
}