import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";
import { UberScene } from "../../core/uberScene";

export class SpaceRenderingPipeline extends AbstractRenderingPipeline {
    constructor(name: string, scene: UberScene) {
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
                PostProcessType.BLACK_HOLE,
                PostProcessType.FXAA
            ])
        );
    }
}
