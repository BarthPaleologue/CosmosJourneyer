import starMaterialFragment from "../../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../../shaders/starMaterial/vertex.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StarModel } from "./starModel";
import { getInverseRotationQuaternion } from "../../uberCore/transforms/basicTransform";
import { Assets } from "../../assets";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import lutFragment from "../../../shaders/starMaterial/utils/lut.glsl";

export class StarMaterial extends ShaderMaterial {
    star: TransformNode;
    starModel: StarModel;
    starSeed: number;

    constructor(star: TransformNode, model: StarModel, scene: Scene) {
        const shaderName = "starMaterial";
        if(Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
        }
        if(Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;
        }

        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time"],
            samplers: ["lut"]
        });

        if(Effect.ShadersStore["starLutFragmentShader"] === undefined) {
            Effect.ShadersStore["starLutFragmentShader"] = lutFragment;
        }


        this.setTexture("lut", Assets.EmptyTexture);
        const lut = new ProceduralTexture("lut", 4096, "starLut", scene, null, true, false);
        lut.refreshRate = 0;
        lut.executeWhenReady(() => {
            this.setTexture("lut", lut);
        });

        this.star = star;
        this.starModel = model;
        this.starSeed = model.seed;
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000);
        this.setVector3("starColor", this.starModel.surfaceColor);
        this.setQuaternion("starInverseRotationQuaternion", getInverseRotationQuaternion(this.star));
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
