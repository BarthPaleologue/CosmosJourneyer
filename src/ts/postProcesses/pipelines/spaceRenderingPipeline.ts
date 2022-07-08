import { Scene } from "@babylonjs/core";
import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";

export class SpaceRenderingPipeline extends AbstractRenderingPipeline {
    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    init() {
        super.init(
            new Set<PostProcessType>([
                PostProcessType.Starfields,
                PostProcessType.VolumetricLights,
                PostProcessType.Oceans,
                PostProcessType.Clouds,
                PostProcessType.Atmospheres,
                PostProcessType.Rings,
                PostProcessType.FXAA
            ])
        );
    }
}
