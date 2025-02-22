// MIT License
//
// Copyright (c) 2025 Barthélemy Paléologue
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { FragmentOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { PerturbNormalBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { MultiplyBlock } from "@babylonjs/core/Materials/Node/Blocks/multiplyBlock";
import { PBRMetallicRoughnessBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { ScaleBlock } from "@babylonjs/core/Materials/Node/Blocks/scaleBlock";
import { TransformBlock } from "@babylonjs/core/Materials/Node/Blocks/transformBlock";
import {
    TrigonometryBlock,
    TrigonometryBlockOperations
} from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";
import { VectorMergerBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorMergerBlock";
import { VectorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorSplitterBlock";
import { VertexOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialSystemValues } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector2, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

export const Stage = {
    VERT: NodeMaterialBlockTargets.Vertex,
    FRAG: NodeMaterialBlockTargets.Fragment,
    VERT_AND_FRAG: NodeMaterialBlockTargets.VertexAndFragment
} as const;

export function uniformCameraPosition(): NodeMaterialConnectionPoint {
    const cameraPosition = new InputBlock("cameraPosition");
    cameraPosition.target = NodeMaterialBlockTargets.VertexAndFragment;
    cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);

    return cameraPosition.output;
}

export function uniformView(): NodeMaterialConnectionPoint {
    const view = new InputBlock("view");
    view.target = NodeMaterialBlockTargets.VertexAndFragment;
    view.setAsSystemValue(NodeMaterialSystemValues.View);

    return view.output;
}

export function uniformViewProjection(): NodeMaterialConnectionPoint {
    const ViewProjection = new InputBlock("ViewProjection");
    ViewProjection.target = NodeMaterialBlockTargets.VertexAndFragment;
    ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

    return ViewProjection.output;
}

export function uniformWorld(): NodeMaterialConnectionPoint {
    const world = new InputBlock("world");
    world.target = NodeMaterialBlockTargets.VertexAndFragment;
    world.setAsSystemValue(NodeMaterialSystemValues.World);

    return world.output;
}

export function vertexAttribute(name: string): NodeMaterialConnectionPoint {
    const position = new InputBlock(name);
    position.target = NodeMaterialBlockTargets.Vertex;
    position.setAsAttribute(name);

    return position.output;
}

export function float(value: number): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock("float");
    inputBlock.target = Stage.VERT_AND_FRAG;
    inputBlock.value = value;

    return inputBlock.output;
}

export function constFloat(name: string, value: number): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = Stage.VERT_AND_FRAG;
    inputBlock.value = value;
    inputBlock.isConstant = true;

    return inputBlock.output;
}

export function uniformFloat(name: string, value: number): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = Stage.VERT_AND_FRAG;
    inputBlock.value = value;
    inputBlock.matrixMode = 0;

    return inputBlock.output;
}

export function sampleTexture(texture: Texture, uv: NodeMaterialConnectionPoint, convertToLinearSpace: boolean) {
    const textureBlock = new TextureBlock("texture");
    textureBlock.target = NodeMaterialBlockTargets.VertexAndFragment;
    textureBlock.convertToGammaSpace = false;
    textureBlock.convertToLinearSpace = convertToLinearSpace;
    textureBlock.disableLevelMultiplication = false;
    textureBlock.texture = texture;

    uv.connectTo(textureBlock.uv);

    return textureBlock;
}

export function transformPosition(
    transformMat4: NodeMaterialConnectionPoint,
    positionVec3: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformPosition");
    transformBlock.target = stage;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 1;

    positionVec3.connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

export function transformDirection(
    transformMat4: NodeMaterialConnectionPoint,
    directionVec3: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformDirection");
    transformBlock.target = stage;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 0;

    directionVec3.connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

export function fract(
    input: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const fractBlock = new TrigonometryBlock("fract");
    fractBlock.operation = TrigonometryBlockOperations.Fract;
    fractBlock.target = stage;

    input.connectTo(fractBlock.input);

    return fractBlock.output;
}

export function mul(
    input: NodeMaterialConnectionPoint,
    factor: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const scaleBlock = new ScaleBlock("Position to UV scale");
    scaleBlock.target = stage;

    input.connectTo(scaleBlock.input);
    factor.connectTo(scaleBlock.factor);

    return scaleBlock.output;
}

export function mulVec(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const multBlock = new MultiplyBlock("scaledMeshUV");
    multBlock.target = stage;

    left.connectTo(multBlock.left);
    right.connectTo(multBlock.right);

    return multBlock.output;
}

export function merge(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint | null,
    w: NodeMaterialConnectionPoint | null,
    stage: NodeMaterialBlockTargets
) {
    const merger = new VectorMergerBlock("Merge");
    merger.target = stage;

    x.connectTo(merger.x);
    y.connectTo(merger.y);

    if (z) {
        z.connectTo(merger.z);
    }

    if (w) {
        w.connectTo(merger.w);
    }

    return merger;
}

export function vecFromBabylon(vec: Vector2 | Vector3 | Vector4) {
    const meshUVScaleFactor = new InputBlock("Mesh UV scale factor");
    meshUVScaleFactor.isConstant = true;
    meshUVScaleFactor.value = vec;

    return meshUVScaleFactor.output;
}

export function vec2(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    return merge(x, y, null, null, stage).xyOut;
}

export function vec3(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    return merge(x, y, z, null, stage).xyzOut;
}

export function vec4(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint,
    w: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    return merge(x, y, z, w, stage).xyzw;
}

export function splitVec2(
    inputVec2: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): VectorSplitterBlock {
    const splitBlock = new VectorSplitterBlock("splitVec2");
    splitBlock.target = stage;

    inputVec2.connectTo(splitBlock.xyIn);

    return splitBlock;
}

export function splitVec3(
    inputVec3: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): VectorSplitterBlock {
    const splitBlock = new VectorSplitterBlock("splitVec3");
    splitBlock.target = stage;

    inputVec3.connectTo(splitBlock.xyzIn);

    return splitBlock;
}

export function xy(
    inputVec3: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const inputSplitted = splitVec3(inputVec3, stage);
    return inputSplitted.xyOut;
}

export function xz(
    inputVec3: NodeMaterialConnectionPoint,
    stage: NodeMaterialBlockTargets
): NodeMaterialConnectionPoint {
    const inputSplitted = splitVec3(inputVec3, stage);

    const outputXZ = new VectorMergerBlock("OutputXZ");
    outputXZ.target = stage;

    inputSplitted.x.connectTo(outputXZ.x);
    inputSplitted.z.connectTo(outputXZ.y);

    return outputXZ.xyOut;
}

export function perturbNormal(
    uv: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    normalTexture: NodeMaterialConnectionPoint,
    bumpStrengthFloat: NodeMaterialConnectionPoint
): NodeMaterialConnectionPoint {
    const Perturbnormal = new PerturbNormalBlock("Perturb normal");
    Perturbnormal.target = NodeMaterialBlockTargets.Fragment;

    uv.connectTo(Perturbnormal.uv);
    positionWorldVec3.connectTo(Perturbnormal.worldPosition);
    normalWorldVec3.connectTo(Perturbnormal.worldNormal);
    normalTexture.connectTo(Perturbnormal.normalMapColor);
    bumpStrengthFloat.connectTo(Perturbnormal.strength);

    return Perturbnormal.output;
}

export function pbrMetallicRoughnessMaterial(
    albedoRgb: NodeMaterialConnectionPoint,
    metallicFloat: NodeMaterialConnectionPoint,
    roughnessFloat: NodeMaterialConnectionPoint,
    ambientOcclusionFloat: NodeMaterialConnectionPoint | null,
    perturbedNormalVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    viewMat4: NodeMaterialConnectionPoint,
    cameraPositionVec3: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint
): NodeMaterialConnectionPoint {
    const PBRMetallicRoughness = new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
    PBRMetallicRoughness.target = NodeMaterialBlockTargets.Fragment;
    PBRMetallicRoughness.useEnergyConservation = true;
    PBRMetallicRoughness.useRadianceOcclusion = true;
    PBRMetallicRoughness.useHorizonOcclusion = true;

    albedoRgb.connectTo(PBRMetallicRoughness.baseColor);
    metallicFloat.connectTo(PBRMetallicRoughness.metallic);
    roughnessFloat.connectTo(PBRMetallicRoughness.roughness);
    ambientOcclusionFloat?.connectTo(PBRMetallicRoughness.ambientOcc);
    perturbedNormalVec3.connectTo(PBRMetallicRoughness.perturbedNormal);
    normalWorldVec3.connectTo(PBRMetallicRoughness.worldNormal);
    viewMat4.connectTo(PBRMetallicRoughness.view);
    cameraPositionVec3.connectTo(PBRMetallicRoughness.cameraPosition);
    positionWorldVec3.connectTo(PBRMetallicRoughness.worldPosition);

    return PBRMetallicRoughness.lighting;
}

export function outputFragColor(colorRgb: NodeMaterialConnectionPoint): FragmentOutputBlock {
    const FragmentOutput = new FragmentOutputBlock("FragmentOutput");
    FragmentOutput.target = NodeMaterialBlockTargets.Fragment;
    FragmentOutput.convertToGammaSpace = false;
    FragmentOutput.convertToLinearSpace = false;

    colorRgb.connectTo(FragmentOutput.rgb);

    return FragmentOutput;
}

export function outputVertexPosition(positionVec4: NodeMaterialConnectionPoint): VertexOutputBlock {
    const VertexOutput = new VertexOutputBlock("VertexOutput");
    VertexOutput.target = NodeMaterialBlockTargets.Vertex;

    positionVec4.connectTo(VertexOutput.vector);

    return VertexOutput;
}
