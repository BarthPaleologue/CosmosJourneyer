import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Transformable } from "../../../architecture/transformable";

import cylinderHabitatMaterialFragment from "../../../../shaders/cylinderHabitatMaterial/fragment.glsl";
import cylinderHabitatMaterialVertex from "../../../../shaders/cylinderHabitatMaterial/vertex.glsl";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames
} from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Textures } from "../../textures";

const CylinderHabitatUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    RADIUS: "radius",
    HEIGHT: "height"
}

const CylinderHabitatSamplerNames = {
    ALBEDO: "albedo",
    NORMAL: "normal",
    METALLIC: "metallic",
    ROUGHNESS: "roughness",
    OCCLUSION: "occlusion",
}

export class CylinderHabitatMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(radius: number, height: number, scene: Scene) {
        const shaderName = "cylinderHabitatMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = cylinderHabitatMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = cylinderHabitatMaterialVertex;
        }

        super(`RingHabitatMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                ...Object.values(CylinderHabitatUniformNames),
                ...Object.values(StellarObjectUniformNames)
            ],
            samplers: [
                ...Object.values(CylinderHabitatSamplerNames),
            ]
        });

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if(activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(CylinderHabitatUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
            this.getEffect().setFloat(CylinderHabitatUniformNames.RADIUS, radius);
            this.getEffect().setFloat(CylinderHabitatUniformNames.HEIGHT, height);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);

            this.getEffect().setTexture(CylinderHabitatSamplerNames.ALBEDO, Textures.SPACE_STATION_ALBEDO);
            this.getEffect().setTexture(CylinderHabitatSamplerNames.NORMAL, Textures.SPACE_STATION_NORMAL);
            this.getEffect().setTexture(CylinderHabitatSamplerNames.METALLIC, Textures.SPACE_STATION_METALLIC);
            this.getEffect().setTexture(CylinderHabitatSamplerNames.ROUGHNESS, Textures.SPACE_STATION_ROUGHNESS);
            this.getEffect().setTexture(CylinderHabitatSamplerNames.OCCLUSION, Textures.SPACE_STATION_AMBIENT_OCCLUSION);
        });
    }

    update(stellarObjects: Transformable[]) {
        this.stellarObjects = stellarObjects;
    }
}