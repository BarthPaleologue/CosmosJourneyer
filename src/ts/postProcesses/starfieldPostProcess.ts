import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { TelluricPlanemo } from "../planemos/telluricPlanemo/telluricPlanemo";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { Settings } from "../settings";
import { nearestBody } from "../utils/nearestBody";
import { AbstractBody } from "../bodies/abstractBody";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PostProcessType } from "./postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { Transformable } from "../uberCore/transforms/basicTransform";

export class StarfieldPostProcess extends UberPostProcess {
    constructor(scene: UberScene, stellarObjects: Transformable[], bodies: AbstractBody[], starfieldRotation: Quaternion) {
        const shaderName = "starfield";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getStellarObjectsUniforms(stellarObjects),
            {
                name: "starfieldRotation",
                type: UniformEnumType.Matrix,
                get: () => {
                    const rotationMatrix = new Matrix();
                    starfieldRotation.toRotationMatrix(rotationMatrix);
                    return rotationMatrix;
                }
            },
            {
                name: "visibility",
                type: UniformEnumType.Float,
                get: () => {
                    if (bodies.length === 0) return 1;

                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of stellarObjects) {
                        if (star instanceof BlackHole) return 1;
                        vis = Math.min(
                            vis,
                            1.0 + Vector3.Dot(star.getTransform().getAbsolutePosition().normalizeToNew(), scene.getActiveController().getActiveCamera().getDirection(Axis.Z))
                        );
                    }
                    vis = 0.5 + vis * 0.5;
                    let vis2 = 1.0;
                    const nearest = nearestBody(scene.getActiveController().getTransform(), bodies);
                    if (nearest instanceof TelluricPlanemo) {
                        const planet = nearest as TelluricPlanemo;
                        if (planet.postProcesses.includes(PostProcessType.ATMOSPHERE)) {
                            const height = planet.getTransform().getAbsolutePosition().length();
                            //FIXME: has to be dynamic
                            const maxHeight = Settings.ATMOSPHERE_HEIGHT;
                            for (const star of stellarObjects) {
                                const sunDir = planet.getTransform().getAbsolutePosition().subtract(star.getTransform().getAbsolutePosition()).normalize();
                                vis2 = Math.min(
                                    vis2,
                                    (height / maxHeight) ** 128 + Math.max(Vector3.Dot(sunDir, planet.getTransform().getAbsolutePosition().negate().normalize()), 0.0) ** 0.5
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
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.Starfield;
                }
            }
        ];

        super("starfield", shaderName, uniforms, samplers, scene);
    }
}
