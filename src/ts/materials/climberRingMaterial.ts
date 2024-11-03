import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { Material } from "@babylonjs/core/Materials/material";
import { MaterialDefines, ShaderLanguage } from "@babylonjs/core";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Nullable } from "@babylonjs/core/types";
import { Textures } from "../assets/textures";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";

/**
 * Extend from MaterialPluginBase to create your plugin.
 */
export class ClimberRingPluginMaterial extends MaterialPluginBase {
    static NAME = "ClimberRingPluginMaterial";

    constructor(material: Material) {
        super(material, ClimberRingPluginMaterial.NAME, 200);
    }

    setEnabled(enabled: boolean) {
        this._enable(enabled);
    }

    // Also, you should always associate a define with your plugin because the list of defines (and their values)
    // is what triggers a recompilation of the shader: a shader is recompiled only if a value of a define changes.
    prepareDefines(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh) {
        super.prepareDefines(defines, scene, mesh);
    }

    getClassName() {
        return "BlackAndWhitePluginMaterial";
    }

    // This is used to inform the system which language is supported
    isCompatible(shaderLanguage: ShaderLanguage): boolean {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
            case ShaderLanguage.WGSL:
                return true;
            default:
                return false;
        }
    }

    getCustomCode(shaderType: string, shaderLanguage?: ShaderLanguage): Nullable<{ [p: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_UPDATE_POSITION: `
                    uvUpdated.y = fract(5.0 * uvUpdated.y);
                    uvUpdated = fract(2.0 * uvUpdated);
                `
            };
        }

        // for other shader types we're not doing anything, return null
        return null;
    }
}

export class ClimberRingMaterial extends PBRMetallicRoughnessMaterial {
    constructor(name: string, scene: Scene) {
        super(name, scene);

        this.baseTexture = Textures.CRATE_ALBEDO;
        this.normalTexture = Textures.CRATE_NORMAL;
        this.metallicRoughnessTexture = Textures.CRATE_METALLIC_ROUGHNESS;

        const plugin = this.pluginManager?.getPlugin(ClimberRingPluginMaterial.NAME);
        if (plugin === null) {
            throw new Error("Plugin not found");
        }
        (plugin as ClimberRingPluginMaterial).setEnabled(true);
    }
}
