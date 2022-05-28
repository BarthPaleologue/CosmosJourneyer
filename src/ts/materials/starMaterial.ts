import {Effect, Scene, ShaderMaterial} from "@babylonjs/core";
import {Star} from "../celestialBodies/stars/star";
import {getRgbFromTemperature} from "../utils/specrend";

import starMaterialFragment from "../../shaders/starMaterial.fragment.fx";
import starMaterialVertex from "../../shaders/starMaterial.vertex.fx";

const shaderName = "starMaterial"
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class StarMaterial extends ShaderMaterial {
    star: Star;
    constructor(star: Star, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: [
                "world", "worldViewProjection", "planetWorldMatrix",
                "starColor", "time", "logarithmicDepthConstant"
            ]
        });
        this.star = star;
    }

    public update() {
        this.setFloat("time", this.star.internalTime);
        this.setVector3("starColor", getRgbFromTemperature(this.star.physicalProperties.temperature));
        this.setMatrix("planetWorldMatrix", this.star.mesh.getWorldMatrix());
    }
}