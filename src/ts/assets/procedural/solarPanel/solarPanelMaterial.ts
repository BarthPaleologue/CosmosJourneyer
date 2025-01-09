import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../../textures";
import { Material } from "@babylonjs/core/Materials/material";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { Nullable } from "@babylonjs/core/types";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";

export class SolarPanelMaterialPlugin extends MaterialPluginBase {
    static NAME = "SolarPanelMaterialPlugin";

    constructor(material: Material) {
        super(material, SolarPanelMaterialPlugin.NAME, 200);
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
        return "SolarPanelMaterialPlugin";
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
        if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_MAIN_BEGIN: `
                    vec2 vAlbedoUV = fract(vPositionUVW.xz * 0.01);
                `
            };
        }

        // for other shader types we're not doing anything, return null
        return null;
    }
}

export class SolarPanelMaterial extends PBRMetallicRoughnessMaterial {
    constructor(name: string, scene: Scene) {
        super(name, scene);

        this.baseTexture = Textures.SOLAR_PANEL_ALBEDO;
        this.normalTexture = Textures.SOLAR_PANEL_NORMAL;
        this.metallicRoughnessTexture = Textures.SOLAR_PANEL_METALLIC_ROUGHNESS;

        const plugin = this.pluginManager?.getPlugin(SolarPanelMaterialPlugin.NAME);
        if (plugin === null) {
            throw new Error("Plugin not found");
        }
        (plugin as SolarPanelMaterialPlugin).setEnabled(true);
    }
}
