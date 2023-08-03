import { getRgbFromTemperature } from "../../utils/specrend";

import starMaterialFragment from "../../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../../shaders/starMaterial/vertex.glsl";
import { StarPhysicalProperties } from "../../model/common";
import { StarModel } from "../../model/stellarObjects/starModel";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getInverseRotationQuaternion } from "../../controller/uberCore/transforms/basicTransform";

const shaderName = "starMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class StarMaterial extends ShaderMaterial {
    star: TransformNode;
    physicalProperties: StarPhysicalProperties;
    starSeed: number;

    constructor(star: TransformNode, model: StarModel, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time", "logarithmicDepthConstant"]
        });
        this.star = star;
        this.physicalProperties = model.physicalProperties;
        this.starSeed = model.seed;
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000); //FIXME: does this work??
        this.setVector3("starColor", getRgbFromTemperature(this.physicalProperties.temperature));
        this.setQuaternion("starInverseRotationQuaternion", getInverseRotationQuaternion(this.star));
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
