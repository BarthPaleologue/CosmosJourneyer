import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";
import { UberScene } from "../../core/uberScene";

export class SpaceRenderingPipeline extends AbstractRenderingPipeline {
    readonly renderingOrder = new Set<PostProcessType>([
        PostProcessType.VOLUMETRIC_LIGHT,
        PostProcessType.OCEAN,
        PostProcessType.CLOUDS,
        PostProcessType.ATMOSPHERE,
        PostProcessType.RING,
        PostProcessType.BLACK_HOLE,
    ]);

    constructor(name: string, scene: UberScene) {
        super(name, scene);
    }
}
