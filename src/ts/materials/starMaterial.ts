import { Effect, Scene, ShaderMaterial } from "@babylonjs/core";
import { getRgbFromTemperature } from "../utils/specrend";

import starMaterialFragment from "../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../shaders/starMaterial/vertex.glsl";
import { BasicTransform } from "../core/transforms/basicTransform";
import { StarPhysicalProperties } from "../bodies/physicalProperties";

const shaderName = "starMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class StarMaterial extends ShaderMaterial {
    star: BasicTransform;
    physicalProperties: StarPhysicalProperties;
    starSeed: number;

    constructor(star: BasicTransform, starSeed: number, physicalProperties: StarPhysicalProperties, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time", "logarithmicDepthConstant"]
        });
        this.star = star;
        this.physicalProperties = physicalProperties;
        this.starSeed = starSeed;
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000); //FIXME: does this work??
        this.setVector3("starColor", getRgbFromTemperature(this.physicalProperties.temperature));
        this.setQuaternion("starInverseRotationQuaternion", this.star.getInverseRotationQuaternion());
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
