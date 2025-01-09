//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../../textures";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { Material } from "@babylonjs/core/Materials/material";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { Nullable } from "@babylonjs/core/types";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";

export class MetalSectionMaterialPlugin extends MaterialPluginBase {
    static NAME = "MetalSectionMaterialPlugin";

    constructor(material: Material) {
        super(material, MetalSectionMaterialPlugin.NAME, 200);
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
                    vec2 vAlbedoUV = vec2(fract(6.0 * vAlbedoUV.x), fract(vPositionUVW.y / 50.0));
                `
            };
        }

        // for other shader types we're not doing anything, return null
        return null;
    }
}

export class MetalSectionMaterial extends PBRMetallicRoughnessMaterial {
    constructor(name: string, scene: Scene) {
        super(name, scene);

        this.baseTexture = Textures.METAL_PANELS_ALBEDO;
        this.normalTexture = Textures.METAL_PANELS_NORMAL;
        this.metallicRoughnessTexture = Textures.METAL_PANELS_METALLIC_ROUGHNESS;
        this.occlusionTexture = Textures.METAL_PANELS_AMBIENT_OCCLUSION;

        const plugin = this.pluginManager?.getPlugin(MetalSectionMaterialPlugin.NAME);
        if (plugin === null) {
            throw new Error("Plugin not found");
        }
        (plugin as MetalSectionMaterialPlugin).setEnabled(true);
    }
}
