import starMaterialFragment from "../../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../../shaders/starMaterial/vertex.glsl";
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
    starModel: StarModel;
    starSeed: number;

    constructor(star: TransformNode, model: StarModel, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time", "logarithmicDepthConstant"],
            //defines: ["#define LOGARITHMICDEPTH"]
        });
        this.star = star;
        this.starModel = model;
        this.starSeed = model.seed;

        /*this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });*/
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000);
        this.setVector3("starColor", this.starModel.surfaceColor);
        this.setQuaternion("starInverseRotationQuaternion", getInverseRotationQuaternion(this.star));
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
