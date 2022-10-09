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
                PostProcessType.BLACK_HOLE,
                PostProcessType.Rings,
                PostProcessType.Oceans,
                PostProcessType.Clouds,
                PostProcessType.Atmospheres,
                PostProcessType.FXAA
            ])
        );
    }
}
