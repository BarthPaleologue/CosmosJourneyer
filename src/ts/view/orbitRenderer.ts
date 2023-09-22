import { LinesMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { OrbitalObject } from "./common";
import { getPointOnOrbitLocal } from "../model/orbit";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export class OrbitRenderer {
    private orbitMeshes: LinesMesh[] = [];

    private orbitalObjects: OrbitalObject[] = [];

    private orbitMaterial: StandardMaterial | null = null;

    setOrbitalObjects(orbitalObjects: OrbitalObject[]) {
        this.reset();
        this.orbitalObjects = orbitalObjects;

        for (const orbitalObject of orbitalObjects) {
            this.createOrbitMesh(orbitalObject);
        }
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

        const orbitMesh = MeshBuilder.CreateLines("orbit", { points: points }, orbitalObject.transform.getScene());
        if (this.orbitMaterial === null) throw new Error("Orbit material is null");
        orbitMesh.material = this.orbitMaterial;
        this.orbitMeshes.push(orbitMesh);
    }

    setVisibility(visible: boolean) {
        for (const orbitMesh of this.orbitMeshes) {
            orbitMesh.visibility = visible ? 1 : 0;
        }
    }

    update() {
        for (let i = 0; i < this.orbitalObjects.length; i++) {
            const orbitalObject = this.orbitalObjects[i];
            const orbitMesh = this.orbitMeshes[i];

            orbitMesh.position = orbitalObject.parentObject?.transform.position ?? Vector3.Zero();
        }
    }

    private reset() {
        this.orbitMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.orbitMeshes = [];
        this.orbitalObjects = [];

        this.orbitMaterial = new StandardMaterial("orbitMaterial");
        this.orbitMaterial.emissiveColor = Color3.White();
        this.orbitMaterial.disableLighting = true;
        this.orbitMaterial.useLogarithmicDepth = true;
    }
}
