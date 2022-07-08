import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";
import { Scene } from "@babylonjs/core";

export class SurfaceRenderingPipeline extends AbstractRenderingPipeline {
    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    init() {
        super.init(new Set<PostProcessType>([
            PostProcessType.Starfields,
            PostProcessType.VolumetricLights,
            PostProcessType.Rings,
            PostProcessType.Oceans,
            PostProcessType.Clouds,
            PostProcessType.Atmospheres,
            PostProcessType.FXAA
        ]));
    }
}