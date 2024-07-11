
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math.vector";

export class StarFieldBox {
    readonly mesh: Mesh;
    readonly material: StandardMaterial;
    readonly texture: CubeTexture;

    constructor(size: number, texture: CubeTexture, scene: Scene) {
        this.mesh = MeshBuilder.CreateBox("skybox", { size: size }, scene);

        this.texture = texture;

        this.material = new StandardMaterial("skyboxMat", scene);
        this.material.backFaceCulling = false;
        this.material.disableDepthWrite = true;
        this.material.reflectionTexture = texture;
        this.material.reflectionTexture.gammaSpace = true;
        this.material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        this.material.disableLighting = true;
        
        this.mesh.material = this.material;
        this.mesh.infiniteDistance = true;

        scene.environmentTexture = texture;
    }

    setRotationQuaternion(quaternion: Quaternion): void {
        const rotationMatrix = new Matrix();
        quaternion.toRotationMatrix(rotationMatrix);

		this.texture.setReflectionTextureMatrix(rotationMatrix);
    }
}