import {
    DepthRenderer,
    Mesh,
    PostProcessRenderEffect,
    PostProcessRenderPipeline,
    Scene,
    Vector3
} from "@babylonjs/core";

import { ChunkForge } from "../chunks/chunkForge";
import { PlayerController } from "../player/playerController";
import { AbstractBody } from "./abstractBody";
import { Star } from "./stars/star";
import {
    AtmosphericScatteringPostProcess
} from "../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { OceanPostProcess } from "../postProcesses/planetPostProcesses/oceanPostProcess";
import { FlatCloudsPostProcess } from "../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { StarfieldPostProcess } from "../postProcesses/starfieldPostProcess";
import { SpaceRenderingPipeline } from "../postProcesses/spaceRenderingPipeline";

export class StarSystemManager {
    readonly scene: Scene;
    readonly depthRenderer: DepthRenderer;
    private readonly _chunkForge: ChunkForge;
    private readonly bodies: AbstractBody[] = [];

    readonly spaceRenderingPipeline: SpaceRenderingPipeline;

    stars: Star[] = [];

    private clock: number = 0;

    constructor(scene: Scene, nbVertices = 64) {
        this.scene = scene;

        this.spaceRenderingPipeline = new SpaceRenderingPipeline("spaceRenderingPipeline", scene);

        this.depthRenderer = new DepthRenderer(scene);
        scene.customRenderTargets.push(this.depthRenderer.getDepthMap());
        this.depthRenderer.getDepthMap().renderList = [];
        //this.depthRenderer.forceDepthWriteTransparentMeshes = true;

        this._chunkForge = new ChunkForge(nbVertices);
    }

    public addBody(body: AbstractBody) {
        this.bodies.push(body);
    }

    public translateAllBodies(deplacement: Vector3): void {
        for (const planet of this.bodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }

    public rotateAllAround(pivot: Vector3, axis: Vector3, amount: number) {
        for (const planet of this.bodies) {
            planet.rotateAround(pivot, axis, amount);
        }
    }

    public getChunkForge(): ChunkForge {
        return this._chunkForge;
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

    public registerMeshDepth(mesh: Mesh) {
        this.depthRenderer.getDepthMap().renderList!.push(mesh);
    }

    public getTime() {
        return this.clock;
    }

    public update(player: PlayerController, lightOrigin: Vector3, deltaTime: number): void {
        this.clock += deltaTime;

        this._chunkForge.update(this.depthRenderer);
        for (const body of this.getBodies()) body.update(player, lightOrigin, deltaTime);

        this.translateAllBodies(player.getAbsolutePosition().scale(-1));
        player.translate(player.getAbsolutePosition().scale(-1));
    }

    public init() {
        this.spaceRenderingPipeline.init();
        this.spaceRenderingPipeline.attachToCamera(this.scene.activeCamera!);
    }
}
