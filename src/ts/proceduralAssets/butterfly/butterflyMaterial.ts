import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import butterflyFragment from "../../../shaders/butterflyMaterial/butterflyFragment.glsl";
import butterflyVertex from "../../../shaders/butterflyMaterial/butterflyVertex.glsl";

import butterflyTexture from "../../../asset/butterfly.png";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

export function createButterflyMaterial(scene: Scene, player?: TransformNode) {
    const shaderName = "butterflyMaterial";
    Effect.ShadersStore[`${shaderName}FragmentShader`] = butterflyFragment;
    Effect.ShadersStore[`${shaderName}VertexShader`] = butterflyVertex;

    const butterflyMaterial = new ShaderMaterial(shaderName, scene, shaderName, {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "time", "lightDirection", "playerPosition"],
        defines: ["#define INSTANCES"],
        samplers: ["butterflyTexture"]
    });

    butterflyMaterial.setTexture("butterflyTexture", new Texture(butterflyTexture, scene));
    butterflyMaterial.backFaceCulling = false;

    let elapsedSeconds = 0;
    scene.onBeforeRenderObservable.add(() => {
        elapsedSeconds += scene.getEngine().getDeltaTime() / 1000;

        if (scene.activeCamera === null) throw new Error("Active camera is null");

        const star = scene.lights[1];
        if (!(star instanceof PointLight)) throw new Error("Could not find star light");

        const lightDirection = star.position.subtract(scene.activeCamera.globalPosition).normalize();
        butterflyMaterial.setVector3("lightDirection", lightDirection);

        const playerPosition = player?.position ?? new Vector3(0, 0, 0);
        butterflyMaterial.setVector3("playerPosition", playerPosition);
        butterflyMaterial.setFloat("time", elapsedSeconds);
    });

    return butterflyMaterial;
}
