import { Vector3 } from "@babylonjs/core";

import { AbstractBody } from "./abstractBody";
import { Star } from "./stars/star";
import { UberScene } from "../core/uberScene";

export class StarSystem {
    readonly scene: UberScene;
    private readonly bodies: AbstractBody[] = [];

    stars: Star[] = [];

    private clock = 0;

    constructor(scene: UberScene) {
        this.scene = scene;
    }

    public addBody(body: AbstractBody) {
        this.bodies.push(body);
    }

    public translateAllBodies(deplacement: Vector3): void {
        for (const planet of this.bodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }

    /**
     * Returns the list of all celestial bodies managed by the star system manager
     */
    public getBodies(): AbstractBody[] {
        return this.bodies;
    }

    /**
     * Returns the nearest body to the origin
     */
    public getNearestBody(): AbstractBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.getBodies()) {
            if (nearest == null) nearest = body;
            else if (body.getAbsolutePosition().lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest!;
    }

    /**
     * Returns the most influential body at a given point
     */
    public getMostInfluentialBodyAtPoint(point: Vector3): AbstractBody {
        //FIXME: use point
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.bodies) {
            if (nearest == null) nearest = body;
            else if (body.physicalProperties.mass / body.getAbsolutePosition().lengthSquared() > nearest.physicalProperties.mass / nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest!;
    }

    public getTime() {
        return this.clock;
    }

    public update(deltaTime: number): void {
        this.clock += deltaTime;

        this.scene._chunkForge.update(this.scene.depthRenderer);
        for (const body of this.getBodies()) body.update(this.scene.getPlayer(), deltaTime);

        this.translateAllBodies(this.scene.getPlayer().getAbsolutePosition().negate());
        this.scene.getPlayer().translate(this.scene.getPlayer().getAbsolutePosition().negate());
    }
}
