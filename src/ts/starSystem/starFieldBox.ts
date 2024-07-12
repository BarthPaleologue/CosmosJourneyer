import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Textures } from "../assets/textures";

export class StarFieldBox implements Transformable {
    readonly mesh: Mesh;
    readonly material: StandardMaterial;
    readonly texture: CubeTexture;

    constructor(scene: Scene) {
        this.mesh = MeshBuilder.CreateBox("skybox", { size: Number.MAX_SAFE_INTEGER }, scene);

        this.texture = Textures.MILKY_WAY;
        this.texture.setReflectionTextureMatrix(Matrix.Identity());

        this.material = new StandardMaterial("skyboxMat", scene);
        this.material.backFaceCulling = false;
        this.material.disableDepthWrite = true;
        this.material.reflectionTexture = this.texture;
        this.material.reflectionTexture.gammaSpace = true;
        this.material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        this.material.disableLighting = true;
        this.material.freeze();

        this.mesh.material = this.material;
        this.mesh.infiniteDistance = true;

        scene.environmentTexture = this.texture;
    }

    setRotationMatrix(rotationMatrix: Matrix): void {
        this.texture.setReflectionTextureMatrix(rotationMatrix);
        this.material.markDirty(true);
    }

    getRotationMatrix(): Matrix {
        return this.texture.getReflectionTextureMatrix();
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
        this.material.dispose();
    }
}