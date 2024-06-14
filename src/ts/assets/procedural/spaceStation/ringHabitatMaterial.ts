import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Transformable } from "../../../architecture/transformable";

import ringHabitatMaterialFragment from "../../../../shaders/ringHabitatMaterial/fragment.glsl";
import ringHabitatMaterialVertex from "../../../../shaders/ringHabitatMaterial/vertex.glsl";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames
} from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Textures } from "../../textures";

const RingHabitatUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
}

const RingHabitatSamplerNames = {
    ALBEDO: "albedo",
    NORMAL: "normal",
    METALLIC: "metallic",
    ROUGHNESS: "roughness",
    OCCLUSION: "occlusion",
}

export class RingHabitatMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(scene: Scene) {
        const shaderName = "ringHabitatMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringHabitatMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = ringHabitatMaterialVertex;
        }

        super(`RingHabitatMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                ...Object.values(RingHabitatUniformNames),
                ...Object.values(StellarObjectUniformNames)
            ],
            samplers: [
                ...Object.values(RingHabitatSamplerNames),
            ]
        });

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if(activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(RingHabitatUniformNames.CAMERA_POSITION, activeCamera.globalPosition);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);

            this.getEffect().setTexture(RingHabitatSamplerNames.ALBEDO, Textures.SPACE_STATION_ALBEDO);
            this.getEffect().setTexture(RingHabitatSamplerNames.NORMAL, Textures.SPACE_STATION_NORMAL);
            this.getEffect().setTexture(RingHabitatSamplerNames.METALLIC, Textures.SPACE_STATION_METALLIC);
            this.getEffect().setTexture(RingHabitatSamplerNames.ROUGHNESS, Textures.SPACE_STATION_ROUGHNESS);
            this.getEffect().setTexture(RingHabitatSamplerNames.OCCLUSION, Textures.SPACE_STATION_AMBIENT_OCCLUSION);
        });
    }

    update(stellarObjects: Transformable[]) {
        this.stellarObjects = stellarObjects;
    }
}