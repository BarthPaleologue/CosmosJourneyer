import { LinesMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { setUpVector } from "../uberCore/transforms/basicTransform";
import { getPointOnOrbitLocal, OrbitalObject } from "./orbit";

export class OrbitRenderer {
    private orbitMeshes: LinesMesh[] = [];

    private orbitalObjects: OrbitalObject[] = [];

    private orbitMaterial: StandardMaterial | null = null;

    private isVisibile = false;

    setOrbitalObjects(orbitalObjects: OrbitalObject[]) {
        this.reset();
        this.orbitalObjects = orbitalObjects;

        for (const orbitalObject of orbitalObjects) {
            this.createOrbitMesh(orbitalObject);
        }

        this.setVisibility(this.isVisibile);
    }

    private createOrbitMesh(orbitalObject: OrbitalObject) {
        const orbit = orbitalObject.model.orbit;
        const nbSteps = 1000;
        const timestep = orbit.period / nbSteps;
        const points: Vector3[] = [];

        for (let step = 0; step < nbSteps; step++) {
            const t = step * timestep;
            points.push(getPointOnOrbitLocal(orbit, t));
        }
        points.push(points[0]);

        const orbitMesh = MeshBuilder.CreateLines("orbit", { points: points }, orbitalObject.getTransform().getScene());
        if (this.orbitMaterial === null) throw new Error("Orbit material is null");
        orbitMesh.material = this.orbitMaterial;
        this.orbitMeshes.push(orbitMesh);
    }

    setVisibility(visible: boolean) {
        this.isVisibile = visible;
        for (const orbitMesh of this.orbitMeshes) {
            orbitMesh.visibility = visible ? 1 : 0;
        }
    }

    isVisible(): boolean {
        return this.isVisibile;
    }

    update() {
        for (let i = 0; i < this.orbitalObjects.length; i++) {
            const orbitalObject = this.orbitalObjects[i];
            const orbitMesh = this.orbitMeshes[i];

            orbitMesh.position = orbitalObject.parentObject?.getTransform().position ?? Vector3.Zero();
            orbitMesh.computeWorldMatrix(true);

            const normalToPlane = orbitalObject.model.orbit.normalToPlane;
            setUpVector(orbitMesh, normalToPlane);
        }
    }

    private reset() {
        this.orbitMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.orbitMeshes = [];
        this.orbitalObjects = [];

        this.orbitMaterial = new StandardMaterial("orbitMaterial");
        this.orbitMaterial.emissiveColor = Color3.White();
        this.orbitMaterial.disableLighting = true;
    }
}