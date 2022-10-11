import { AbstractRenderingPipeline, PostProcessType } from "./abstractRenderingPipeline";
import { UberScene } from "../../core/uberScene";

export class SurfaceRenderingPipeline extends AbstractRenderingPipeline {
    readonly renderingOrder = new Set<PostProcessType>([
        PostProcessType.STARFIELD,
        PostProcessType.VOLUMETRIC_LIGHT,
        PostProcessType.BLACK_HOLE,
        PostProcessType.RING,
        PostProcessType.OCEAN,
        PostProcessType.CLOUDS,
        PostProcessType.ATMOSPHERE,
        PostProcessType.FXAA
    ]);

    constructor(name: string, scene: UberScene) {
        super(name, scene);
    }
}
