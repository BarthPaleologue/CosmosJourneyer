import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Transformable } from "../../../architecture/transformable";

import landingPadMaterialFragment from "../../../../shaders/landingPadMaterial/fragment.glsl";
import landingPadMaterialVertex from "../../../../shaders/landingPadMaterial/vertex.glsl";
import { Textures } from "../../textures";
import { DynamicTexture } from "@babylonjs/core";
import { Settings } from "../../../settings";

const LandingPadUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    ASPECT_RATIO: "aspectRatio"
};

const LandingPadSamplerNames = {
    ALBEDO_MAP: "albedoMap",
    NORMAL_MAP: "normalMap",
    METALLIC_MAP: "metallicMap",
    ROUGHNESS_MAP: "roughnessMap",
    NUMBER_TEXTURE: "numberTexture"
};

export class LandingPadMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(padNumber: number, aspectRatio: number, scene: Scene) {
        const shaderName = "landingPadMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = landingPadMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = landingPadMaterialVertex;
        }

        super(`LandingPadMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [...Object.values(LandingPadUniformNames), ...Object.values(StellarObjectUniformNames)],
            samplers: [...Object.values(LandingPadSamplerNames)]
        });

        const textureResolution = 2048;
        const numberTexture = new DynamicTexture(
            "dynamic texture",
            {
                width: textureResolution * aspectRatio,
                height: textureResolution
            },
            scene
        );

        //Add text to dynamic texture
        const font = `bold 512px ${Settings.MAIN_FONT}`;
        numberTexture.drawText(`${padNumber}`, null, null, font, "white", null, true, true);

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if (activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(LandingPadUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
            this.getEffect().setFloat(LandingPadUniformNames.ASPECT_RATIO, aspectRatio);

            this.getEffect().setTexture(LandingPadSamplerNames.ALBEDO_MAP, Textures.METAL_PANELS_ALBEDO);
            this.getEffect().setTexture(LandingPadSamplerNames.NORMAL_MAP, Textures.METAL_PANELS_NORMAL);
            this.getEffect().setTexture(LandingPadSamplerNames.METALLIC_MAP, Textures.METAL_PANELS_METALLIC);
            this.getEffect().setTexture(LandingPadSamplerNames.ROUGHNESS_MAP, Textures.METAL_PANELS_ROUGHNESS);
            this.getEffect().setTexture(LandingPadSamplerNames.NUMBER_TEXTURE, numberTexture);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);
        });

        this.onDisposeObservable.add(() => {
            numberTexture.dispose();
        });
    }

    update(stellarObjects: Transformable[]): void {
        this.stellarObjects = stellarObjects;
    }
}
