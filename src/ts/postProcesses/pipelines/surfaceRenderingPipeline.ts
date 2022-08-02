import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";
import { UberScene } from "../../core/uberScene";

export class SurfaceRenderingPipeline extends AbstractRenderingPipeline {
    constructor(name: string, scene: UberScene) {
        super(name, scene);
    }

    init() {
        super.init(
            new Set<PostProcessType>([
                PostProcessType.Starfields,
                PostProcessType.VolumetricLights,
                PostProcessType.Rings,
                PostProcessType.Oceans,
                PostProcessType.Clouds,
                PostProcessType.Atmospheres,
                PostProcessType.FXAA
            ])
        );
    }
}
