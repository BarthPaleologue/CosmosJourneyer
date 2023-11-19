import lensFlareFragment from "../../shaders/lensflare.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { moveTowards } from "../utils/moveTowards";
import { Star } from "../stellarObjects/star/star";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";

const shaderName = "lensflare";
Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;

export type LensFlareSettings = {
    visibility: number;
};

export class LensFlarePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: LensFlareSettings;
    readonly object: StellarObject;

    constructor(object: StellarObject, scene: UberScene) {
        const settings: LensFlareSettings = {
            visibility: 1
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(object),
            ...getActiveCameraUniforms(scene),
            {
                name: "flareColor",
                type: UniformEnumType.Vector3,
                get: () => {
                    if (object instanceof Star) return object.model.surfaceColor;
                    else return new Vector3(1, 1, 1);
                }
            },
            {
                name: "visibility",
                type: UniformEnumType.Float,
                get: () => {
                    // send raycast from camera to object and check early intersections
                    const raycastResult = new PhysicsRaycastResult();
                    const start = scene.getActiveUberCamera().getAbsolutePosition();
                    const end = object.getTransform().getAbsolutePosition();
                    (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
                    const occulted = raycastResult.hasHit && raycastResult.body?.transformNode.name !== object.name;

                    if (occulted && settings.visibility > 0) {
                        settings.visibility = moveTowards(settings.visibility, 0, 0.5);
                    } else if (!occulted && settings.visibility < 1) {
                        settings.visibility = moveTowards(settings.visibility, 1, 0.5);
                    }

                    return settings.visibility;
                }
            },
            {
                name: "aspectRatio",
                type: UniformEnumType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(object.name, shaderName, uniforms, samplers, scene);

        this.object = object;
        this.settings = settings;
    }
}
