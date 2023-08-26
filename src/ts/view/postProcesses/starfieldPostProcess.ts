import starfieldFragment from "../../../shaders/starfieldFragment.glsl";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { Settings } from "../../settings";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { nearestBody } from "../../utils/nearestBody";
import { AbstractBody } from "../bodies/abstractBody";
import { Assets } from "../../controller/assets";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PostProcessType } from "./postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { getForwardDirection } from "../../controller/uberCore/transforms/basicTransform";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends UberPostProcess {
    settings: StarfieldSettings;

    constructor(scene: UberScene, stellarObjects: StellarObject[], bodies: AbstractBody[]) {
        const settings: StarfieldSettings = {
            foo: 1
        };

        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getStellarObjectsUniforms(stellarObjects),
            {
                name: "visibility",
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of stellarObjects) {
                        if (star instanceof BlackHole) return 1;
                        vis = Math.min(vis, 1.0 + Vector3.Dot(star.transform.getAbsolutePosition().normalizeToNew(), scene.getActiveController().getActiveCamera().getDirection(Axis.Z)));
                    }
                    vis = 0.5 + vis * 0.5;
                    let vis2 = 1.0;
                    const nearest = nearestBody(scene.getActiveController().getTransform(), bodies);
                    if (nearest instanceof TelluricPlanemo) {
                        const planet = nearest as TelluricPlanemo;
                        if (planet.postProcesses.includes(PostProcessType.ATMOSPHERE)) {
                            const height = planet.transform.getAbsolutePosition().length();
                            //FIXME: has to be dynamic
                            const maxHeight = Settings.ATMOSPHERE_HEIGHT;
                            for (const star of stellarObjects) {
                                const sunDir = planet.transform.getAbsolutePosition().subtract(star.transform.getAbsolutePosition()).normalize();
                                vis2 = Math.min(
                                    vis2,
                                    (height / maxHeight) ** 128 + Math.max(Vector3.Dot(sunDir, planet.transform.getAbsolutePosition().negate().normalize()), 0.0) ** 0.5
                                );
                            }
                        }
                    }
                    vis = Math.min(vis, vis2);
                    return vis;
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "starfieldTexture",
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.Starfield;
                }
            }
        ];

        super("starfield", shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
