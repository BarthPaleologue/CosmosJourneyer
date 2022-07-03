import { Effect, Scene, ShaderMaterial } from "@babylonjs/core";
import { Star } from "../bodies/stars/star";
import { getRgbFromTemperature } from "../utils/specrend";

import starMaterialFragment from "../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../shaders/starMaterial/vertex.glsl";

const shaderName = "starMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class StarMaterial extends ShaderMaterial {
    star: Star;
    constructor(star: Star, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: [
                "world", "worldViewProjection",
                "seed", "starColor",
                "starPosition",
                "starInverseRotationQuaternion",
                "time", "logarithmicDepthConstant"]
        });
        this.star = star;
    }

    public update() {
        this.setFloat("time", this.star.internalTime);
        this.setVector3("starColor", getRgbFromTemperature(this.star.physicalProperties.temperature));
        this.setQuaternion("starInverseRotationQuaternion", this.star.getInverseRotationQuaternion());
        this.setFloat("seed", this.star.seed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
