export class Mouse {
    private mouseX = 0;
    private mouseY = 0;

    private mouseDX = 0;
    private mouseDY = 0;

    private mouseDXToCenter = 0;
    private mouseDYToCenter = 0;

    private deadAreaRadius = 100;

    constructor() {
        window.addEventListener("mousemove", e => {
            this.mouseDX = (e.x - this.mouseX) / window.innerWidth;
            this.mouseDY = (e.y - this.mouseY) / window.innerHeight;

            this.mouseX = e.x;
            this.mouseY = e.y;

            this.mouseDXToCenter = e.x - window.innerWidth / 2;
            this.mouseDYToCenter = e.y - window.innerHeight / 2;

            if (this.mouseDXToCenter ** 2 + this.mouseDYToCenter ** 2 < this.deadAreaRadius ** 2) {
                this.mouseDXToCenter = 0;
                this.mouseDYToCenter = 0;
            }
        });
    }

    public getDX(): number {
        return this.mouseDX;
    }
    public getDY(): number {
        return this.mouseDY;
    }
    public getDXToCenter(): number {
        return this.mouseDXToCenter;
    }
    public getDYToCenter(): number {
        return this.mouseDYToCenter;
    }
}