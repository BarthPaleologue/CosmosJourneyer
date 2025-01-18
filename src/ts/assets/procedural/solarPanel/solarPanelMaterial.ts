import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames
} from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Transformable } from "../../../architecture/transformable";

import solarPanelMaterialFragment from "../../../../shaders/solarPanelMaterial/fragment.glsl";
import solarPanelMaterialVertex from "../../../../shaders/solarPanelMaterial/vertex.glsl";
import { Textures } from "../../textures";

const SolarPanelUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition"
};

const SolarPanelSamplerNames = {
    ALBEDO_MAP: "albedoMap",
    NORMAL_MAP: "normalMap",
    METALLIC_MAP: "metallicMap",
    ROUGHNESS_MAP: "roughnessMap"
};

export class SolarPanelMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(scene: Scene) {
        const shaderName = "solarPanelMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = solarPanelMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = solarPanelMaterialVertex;
        }

        super(`SolarPanelMaterial`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [...Object.values(SolarPanelUniformNames), ...Object.values(StellarObjectUniformNames)],
            samplers: [...Object.values(SolarPanelSamplerNames)]
        });

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if (activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(SolarPanelUniformNames.CAMERA_POSITION, activeCamera.globalPosition);

            this.getEffect().setTexture(SolarPanelSamplerNames.ALBEDO_MAP, Textures.SOLAR_PANEL_ALBEDO);
            this.getEffect().setTexture(SolarPanelSamplerNames.NORMAL_MAP, Textures.SOLAR_PANEL_NORMAL);
            this.getEffect().setTexture(SolarPanelSamplerNames.METALLIC_MAP, Textures.SOLAR_PANEL_METALLIC);
            this.getEffect().setTexture(SolarPanelSamplerNames.ROUGHNESS_MAP, Textures.SOLAR_PANEL_ROUGHNESS);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);
        });
    }

    update(stellarObjects: Transformable[]): void {
        this.stellarObjects = stellarObjects;
    }

    dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean) {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
        this.stellarObjects.length = 0;
    }
}
