import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../../textures";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import {
    add,
    f,
    min,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbrMetallicRoughnessMaterial,
    perturbNormal,
    split,
    step,
    sub,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec,
    vec2,
    vertexAttribute,
    length,
    xz,
    mix,
    div
} from "../../../utils/bsl";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Settings } from "../../../settings";

export class LandingPadMaterial extends NodeMaterial {
    constructor(padNumber: number, scene: Scene) {
        super(`LandingPadMaterial${padNumber}`, scene);
        this.mode = NodeMaterialModes.Material;

        const numberTexture = Textures.GetLandingPadNumberTexture(padNumber, scene);
        if (numberTexture === undefined) {
            throw new Error(`No texture for pad number ${padNumber}`);
        }

        // Vertex Shader

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");
        const uvSplit = split(uv);

        const centeredUV = split(sub(uv, f(0.5)));
        const centeredUVScaled = vec2(mul(centeredUV.x, f(Settings.LANDING_PAD_ASPECT_RATIO)), centeredUV.y);

        const proceduralUV = mul(xz(position), f(0.1));

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        // Fragment Shader

        //float paintWeight = texture(numberTexture, vec2(1.0 - vUV.y, 1.0 - vUV.x + 0.01)).a;
        const paintMaskUV = sub(f(1), vec2(uvSplit.y, sub(uvSplit.x, f(0.01))));
        const paintWeight = textureSample(numberTexture, paintMaskUV).a;

        const paintAlbedo = vec(Vector3.One());

        const borderThickness = f(0.03);

        const borderLeftMask = step(uvSplit.x, borderThickness);
        const borderRightMask = step(sub(f(1), uvSplit.x), borderThickness);

        const borderX = add(borderLeftMask, borderRightMask);

        const borderTopMask = step(uvSplit.y, borderThickness);
        const borderBottomMask = step(sub(f(1), uvSplit.y), borderThickness);

        const borderY = add(borderTopMask, borderBottomMask);

        const borderWeight = min(add(borderX, borderY), f(1));

        const circleRadius = f(0.25);
        const circleThickness = f(0.01);
        const distToCenter = length(centeredUVScaled);

        const circleMask = mul(
            step(sub(circleRadius, circleThickness), distToCenter),
            step(distToCenter, add(circleRadius, circleThickness))
        );

        const fullPaintWeight = add(add(paintWeight, borderWeight), circleMask);

        const albedoTexture = textureSample(Textures.CONCRETE_ALBEDO, proceduralUV, {
            convertToLinearSpace: true
        });
        const metallicRoughness = textureSample(Textures.CONCRETE_METALLIC_ROUGHNESS, proceduralUV);
        const normalMapValue = textureSample(Textures.CONCRETE_NORMAL, proceduralUV);
        const ambientOcclusion = textureSample(Textures.CONCRETE_AMBIENT_OCCLUSION, proceduralUV);

        const finalAlbedo = mix(albedoTexture.rgb, paintAlbedo, fullPaintWeight);
        const finalMetallic = mix(metallicRoughness.r, f(0), fullPaintWeight);
        const finalRoughness = mix(metallicRoughness.g, f(0.7), fullPaintWeight);
        const finalAmbientOcclusion = mix(ambientOcclusion.r, f(1), fullPaintWeight);

        const perturbedNormal = perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalMapValue.rgb,
            sub(f(1), mul(fullPaintWeight, f(0.5)))
        );

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrLighting = pbrMetallicRoughnessMaterial(
            finalAlbedo,
            finalMetallic,
            finalRoughness,
            finalAmbientOcclusion,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW
        );

        const additionalLight = mul(finalAlbedo, div(f(0.05), add(f(0.05), mul(distToCenter, distToCenter))));

        const fragOutput = outputFragColor(add(pbrLighting, additionalLight));

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragOutput);
        this.build();
    }
}
