import { Effect, Material, MaterialHelper, Scene, ShaderMaterial } from "@babylonjs/core";

import starMaterialFragment from "../../shaders/ringMaterial/fragment.glsl";
import starMaterialVertex from "../../shaders/ringMaterial/vertex.glsl";
import { AbstractBody } from "../bodies/abstractBody";

const shaderName = "ringMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;

export class RingMaterial extends ShaderMaterial {
    body: AbstractBody;
    constructor(body: AbstractBody, scene: Scene) {
        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: [
                "world", "worldViewProjection",
                "ringStart", "ringEnd",
                "planetRadius", "seed",
                "logarithmicDepthConstant"],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.onBindObservable.add(() => {
            let effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.backFaceCulling = false;
        this.body = body;
        this.needDepthPrePass = true;

        this.setFloat("ringStart", 2);
        this.setFloat("ringEnd", 4);
        this.setFloat("planetRadius", this.body.getApparentRadius());
        this.setFloat("seed", this.body.seed);
    }

    public update() {
        this.setFloat("ringStart", 2);
        this.setFloat("ringEnd", 4);
        this.setFloat("planetRadius", this.body.getApparentRadius());
        this.setFloat("seed", this.body.seed);
    }
}
