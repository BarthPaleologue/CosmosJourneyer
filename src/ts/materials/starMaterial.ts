import { Effect, Scene, ShaderMaterial } from "@babylonjs/core";
import { getRgbFromTemperature } from "../utils/specrend";

import starMaterialFragment from "../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../shaders/starMaterial/vertex.glsl";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { StarPhysicalProperties } from "../descriptors/common";
import { StarDescriptor } from "../descriptors/stellarObjects/starDescriptor";

const shaderName = "starMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class StarMaterial extends ShaderMaterial {
    star: BasicTransform;
    physicalProperties: StarPhysicalProperties;
    starSeed: number;

    constructor(star: BasicTransform, descriptor: StarDescriptor, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time", "logarithmicDepthConstant"]
        });
        this.star = star;
        this.physicalProperties = descriptor.physicalProperties;
        this.starSeed = descriptor.seed;
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000); //FIXME: does this work??
        this.setVector3("starColor", getRgbFromTemperature(this.physicalProperties.temperature));
        this.setQuaternion("starInverseRotationQuaternion", this.star.getInverseRotationQuaternion());
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
