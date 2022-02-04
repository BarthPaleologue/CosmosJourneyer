import { SolidPlanet } from "./planet";
import { ChunkForge, TaskType } from "../../forge/chunkForge";
import { Direction, getQuaternionFromDirection } from "../../toolbox/direction";
import { Quaternion, Vector3 } from "../../toolbox/algebra";

/**
 * Returns the node position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the node
 * @returns the plane space coordinates of the chunk
 */
export function getChunkPlaneSpacePositionFromPath(chunkLength: number, path: number[]): Vector3 {
    let x = 0;
    let y = 0;
    for (let i = 0; i < path.length; ++i) {
        /*
            3   2
              +
            0   1
        */
        // offset to get to the center of the children from the center of the current chunk
        // (chunkLength / 2) / (2 ** (i + 1)) est la moitié de la taille d'un chunk enfant (offset) donc on simplifie pas : c'est plus clair ainsi
        switch (path[i]) {
            case 0:
                x -= (chunkLength / 2) / (2 ** (i + 1));
                y -= (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 1:
                x += (chunkLength / 2) / (2 ** (i + 1));
                y -= (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 2:
                x += (chunkLength / 2) / (2 ** (i + 1));
                y += (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 3:
                x -= (chunkLength / 2) / (2 ** (i + 1));
                y += (chunkLength / 2) / (2 ** (i + 1));
                break;
            default:
                throw new Error(`${path[i]} is not a valid index for a child of a quadtree node !`);
        }
    }
    return new Vector3(x, y, 0);
}

/**
 * Returns chunk position in planet space
 * @param chunkLength the length of the chunk
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @returns the position in planet space
 */
export function getChunkSphereSpacePositionFromPath(chunkLength: number, path: number[], direction: Direction, planetRotationQuaternion: BABYLON.Quaternion): Vector3 {

    // on récupère la position dans le plan
    let position = getChunkPlaneSpacePositionFromPath(chunkLength, path);

    // on l'offset pour préparer à récupérer la position dans le cube
    position.addInPlace(new Vector3(0, 0, -chunkLength / 2));

    let rotationQuaternion = getQuaternionFromDirection(direction);
    position.applyQuaternionInPlace(rotationQuaternion);

    // on projette cette position sur la sphère
    position.normalizeInPlace();
    position.scaleInPlace(chunkLength / 2);

    // on match cette position avec la rotation de la planète
    position.applyQuaternionInPlace(Quaternion.FromBABYLON(planetRotationQuaternion));

    // c'est prêt !
    return position;
}

import grass from "../../../../asset/textures/grass.png";

// ne pas supprimer la classe pour cause de peut être des arbres et de l'herbe
export class PlanetChunk {

    public readonly mesh: BABYLON.Mesh;

    public grassParticleSystem: BABYLON.SolidParticleSystem | null = null;
    public grassPositions: BABYLON.Vector3[] = [];

    //public testBox: BABYLON.Mesh;

    constructor(path: number[], rootChunkLength: number, direction: Direction, parentNode: BABYLON.Mesh, scene: BABYLON.Scene, chunkForge: ChunkForge, surfaceMaterial: BABYLON.Material, planet: SolidPlanet) {
        let id = `[D${direction}][P${path.join("")}]`;

        // computing the position of the chunk on the side of the planet
        let position = getChunkPlaneSpacePositionFromPath(rootChunkLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= rootChunkLength / 2;

        this.mesh = new BABYLON.Mesh(`Chunk${id}`, scene);
        this.mesh.material = surfaceMaterial;

        // TODO: ajouter transparence, orienter et tout le bazar tmtc
        // bientôt des arbres
        /*let testBox = BABYLON.Mesh.CreatePlane(`TestBox${id}`, 5000, scene);
        let TestBoxMaterial = new BABYLON.StandardMaterial("TestBoxMaterial", scene);
        TestBoxMaterial.emissiveTexture = new BABYLON.Texture(grass, scene);
        TestBoxMaterial.emissiveTexture.hasAlpha = true;
        TestBoxMaterial.emissiveTexture.getAlphaFromRGB = true;
        TestBoxMaterial.backFaceCulling = false;
        testBox.material = TestBoxMaterial;

        this.testBox = testBox;
        this.testBox.isVisible = false;

        let gps = new BABYLON.SolidParticleSystem(`GrassParticles${id}`, scene);
        gps.addShape(this.testBox, 1);
        this.grassParticleSystem = gps;
        this.grassParticleSystem.setParticles();
        this.grassParticleSystem.buildMesh();
        this.grassParticleSystem.mesh.material = TestBoxMaterial;
        this.grassParticleSystem.mesh.parent = this.mesh;*/

        /*let debugMaterial = new BABYLON.StandardMaterial("debug", scene);
        debugMaterial.emissiveColor = BABYLON.Color3.Random();
        debugMaterial.specularColor = BABYLON.Color3.Black();
        debugMaterial.diffuseColor = BABYLON.Color3.Black();
        debugMaterial.backFaceCulling = false;
        debugMaterial.useLogarithmicDepth = true;
        debugMaterial.wireframe = true;

        this.mesh.material = debugMaterial;*/

        this.mesh.parent = parentNode;

        //needed for potential lens flares
        //this.mesh.isBlocker = true;

        // revoir les paramètres passés dans la taches => trouver les dénos communs
        chunkForge.addTask({
            taskType: TaskType.Build,
            id: id,
            planet: planet,
            position: position.toBabylon(),
            depth: path.length,
            direction: direction,
            mesh: this.mesh,
            chunk: this,
        });

        // sphérisation du cube
        // note : on sphérise après car le worker script calcule les positions à partir du cube
        position.normalizeInPlace();
        position.scaleInPlace(rootChunkLength / 2);

        this.mesh.position.x = position.x;
        this.mesh.position.y = position.y;
        this.mesh.position.z = position.z;
    }
}