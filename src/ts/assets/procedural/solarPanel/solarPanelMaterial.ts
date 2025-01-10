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
import { PerturbNormalBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { PBRMetallicRoughnessBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { TransformBlock } from "@babylonjs/core/Materials/Node/Blocks/transformBlock";
import { NodeMaterialSystemValues } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { FragmentOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { VertexOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { VectorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorSplitterBlock";
import { VectorMergerBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorMergerBlock";
import { ScaleBlock } from "@babylonjs/core/Materials/Node/Blocks/scaleBlock";
import { TrigonometryBlock, TrigonometryBlockOperations } from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";

export class SolarPanelMaterial extends NodeMaterial {
    constructor(scene: Scene) {
        super("SolarPanelNodeMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        const position = new InputBlock("position");
        position.target = NodeMaterialBlockTargets.Vertex;
        position.setAsAttribute("position");

        const world = new InputBlock("world");
        world.target = NodeMaterialBlockTargets.Vertex;
        world.setAsSystemValue(NodeMaterialSystemValues.World);

        const positionW = new TransformBlock("positionW");
        positionW.target = NodeMaterialBlockTargets.Vertex;
        positionW.complementZ = 0;
        positionW.complementW = 1;

        position.output.connectTo(positionW.vector);
        world.output.connectTo(positionW.transform);

        const ViewProjection = new InputBlock("ViewProjection");
        ViewProjection.target = NodeMaterialBlockTargets.Vertex;
        ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

        const positionClipSpace = new TransformBlock("positionClipSpace");
        positionClipSpace.target = NodeMaterialBlockTargets.Vertex;
        positionClipSpace.complementZ = 0;
        positionClipSpace.complementW = 1;

        positionW.output.connectTo(positionClipSpace.vector);
        ViewProjection.output.connectTo(positionClipSpace.transform);

        const VertexOutput = new VertexOutputBlock("VertexOutput");
        VertexOutput.target = NodeMaterialBlockTargets.Vertex;

        positionClipSpace.output.connectTo(VertexOutput.vector);

        const normal = new InputBlock("normal");
        normal.target = NodeMaterialBlockTargets.Vertex;
        normal.setAsAttribute("normal");

        const normalW = new TransformBlock("normalW");
        normalW.target = NodeMaterialBlockTargets.Vertex;
        normalW.complementZ = 0;
        normalW.complementW = 0;

        normal.output.connectTo(normalW.vector);
        world.output.connectTo(normalW.transform);

        const positionXZSplitter = new VectorSplitterBlock("Position XZ splitter");
        positionXZSplitter.target = NodeMaterialBlockTargets.Fragment;

        position.output.connectTo(positionXZSplitter.xyzIn);

        const positionToVec2 = new VectorMergerBlock("Position to vec2");
        positionToVec2.target = NodeMaterialBlockTargets.Fragment;

        positionXZSplitter.x.connectTo(positionToVec2.x);
        positionXZSplitter.z.connectTo(positionToVec2.y);

        const positionToUvScaleFactor = new InputBlock("Position to UV scale factor");
        positionToUvScaleFactor.isConstant = true;
        positionToUvScaleFactor.value = 0.01;
        positionToUvScaleFactor.target = NodeMaterialBlockTargets.Fragment;

        const positionToUvScale = new ScaleBlock("Position to UV scale");
        positionToUvScale.target = NodeMaterialBlockTargets.Fragment;

        positionToVec2.xyOut.connectTo(positionToUvScale.input);
        positionToUvScaleFactor.output.connectTo(positionToUvScale.factor);

        const uv = new TrigonometryBlock("UV fract");
        uv.operation = TrigonometryBlockOperations.Fract;
        uv.target = NodeMaterialBlockTargets.Fragment;

        positionToUvScale.output.connectTo(uv.input);

        const albedoTexture = new TextureBlock("albedoTexture");
        albedoTexture.target = NodeMaterialBlockTargets.VertexAndFragment;
        albedoTexture.convertToGammaSpace = false;
        albedoTexture.convertToLinearSpace = true;
        albedoTexture.disableLevelMultiplication = false;
        albedoTexture.texture = Textures.SOLAR_PANEL_ALBEDO;

        uv.output.connectTo(albedoTexture.uv);

        const metallicRoughnesstexture = new TextureBlock("metallicRoughnessTexture");
        metallicRoughnesstexture.target = NodeMaterialBlockTargets.VertexAndFragment;
        metallicRoughnesstexture.convertToGammaSpace = false;
        metallicRoughnesstexture.convertToLinearSpace = false;
        metallicRoughnesstexture.disableLevelMultiplication = false;
        metallicRoughnesstexture.texture = Textures.SOLAR_PANEL_METALLIC_ROUGHNESS;

        uv.output.connectTo(metallicRoughnesstexture.uv);

        // TextureBlock
        const normalTexture = new TextureBlock("normalTexture");
        normalTexture.target = NodeMaterialBlockTargets.VertexAndFragment;
        normalTexture.convertToGammaSpace = false;
        normalTexture.convertToLinearSpace = false;
        normalTexture.disableLevelMultiplication = false;
        normalTexture.texture = Textures.SOLAR_PANEL_NORMAL;

        uv.output.connectTo(normalTexture.uv);

        const bumpStrength = new InputBlock("Bump strength");
        bumpStrength.target = NodeMaterialBlockTargets.Fragment;
        bumpStrength.value = 1;
        bumpStrength.matrixMode = 0;

        const Perturbnormal = new PerturbNormalBlock("Perturb normal");
        Perturbnormal.target = NodeMaterialBlockTargets.Fragment;

        uv.output.connectTo(Perturbnormal.uv);
        positionW.output.connectTo(Perturbnormal.worldPosition);
        normalW.output.connectTo(Perturbnormal.worldNormal);
        normalTexture.rgb.connectTo(Perturbnormal.normalMapColor);
        bumpStrength.output.connectTo(Perturbnormal.strength);

        const view = new InputBlock("view");
        view.target = NodeMaterialBlockTargets.Vertex;
        view.setAsSystemValue(NodeMaterialSystemValues.View);

        const cameraPosition = new InputBlock("cameraPosition");
        cameraPosition.target = NodeMaterialBlockTargets.VertexAndFragment;
        cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);

        const PBRMetallicRoughness = new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
        PBRMetallicRoughness.target = NodeMaterialBlockTargets.Fragment;
        PBRMetallicRoughness.useEnergyConservation = true;
        PBRMetallicRoughness.useRadianceOcclusion = true;
        PBRMetallicRoughness.useHorizonOcclusion = true;

        albedoTexture.rgb.connectTo(PBRMetallicRoughness.baseColor);
        metallicRoughnesstexture.r.connectTo(PBRMetallicRoughness.metallic);
        metallicRoughnesstexture.g.connectTo(PBRMetallicRoughness.roughness);
        Perturbnormal.output.connectTo(PBRMetallicRoughness.perturbedNormal);
        normalW.output.connectTo(PBRMetallicRoughness.worldNormal);
        view.output.connectTo(PBRMetallicRoughness.view);
        cameraPosition.output.connectTo(PBRMetallicRoughness.cameraPosition);
        positionW.output.connectTo(PBRMetallicRoughness.worldPosition);

        const FragmentOutput = new FragmentOutputBlock("FragmentOutput");
        FragmentOutput.target = NodeMaterialBlockTargets.Fragment;
        FragmentOutput.convertToGammaSpace = false;
        FragmentOutput.convertToLinearSpace = false;

        PBRMetallicRoughness.lighting.connectTo(FragmentOutput.rgb);

        this.addOutputNode(VertexOutput);
        this.addOutputNode(FragmentOutput);
        this.build();
    }
}
