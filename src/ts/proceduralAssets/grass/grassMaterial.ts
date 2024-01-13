import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";

import grassFragment from "../../../shaders/grassMaterial/grassFragment.glsl";
import grassVertex from "../../../shaders/grassMaterial/grassVertex.glsl";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import perlinNoise from "../../../asset/perlin.png";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function createGrassMaterial(light: DirectionalLight, scene: Scene, player?: TransformNode) {
  const shaderName = "grassMaterial";
  Effect.ShadersStore[`${shaderName}FragmentShader`] = grassFragment;
  Effect.ShadersStore[`${shaderName}VertexShader`] = grassVertex;

  const grassMaterial = new ShaderMaterial(shaderName, scene, shaderName, {
    attributes: ["position", "normal"],
    uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "time", "lightDirection", "cameraPosition", "playerPosition"],
    defines: ["#define INSTANCES"],
    samplers: ["perlinNoise"]
  });

  const perlinTexture = new Texture(perlinNoise, scene);

  grassMaterial.backFaceCulling = false;
  grassMaterial.setVector3("lightDirection", light.direction);
  grassMaterial.setTexture("perlinNoise", perlinTexture);

  let elapsedSeconds = 0;
  scene.onBeforeRenderObservable.add(() => {
    elapsedSeconds += scene.getEngine().getDeltaTime() / 1000;

    if(scene.activeCamera === null) throw new Error("Active camera is null");

    const playerPosition = player ? player.position : new Vector3(0, 500, 0); // high y to avoid interaction with grass
    const cameraPosition = scene.activeCamera.globalPosition;
    grassMaterial.setVector3("playerPosition", playerPosition);
    grassMaterial.setVector3("cameraPosition", cameraPosition);
    grassMaterial.setFloat("time", elapsedSeconds);
  });

  return grassMaterial;
}