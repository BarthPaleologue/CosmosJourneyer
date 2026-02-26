//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { RangeToPercent } from "@babylonjs/core/Maths/math.scalar.functions";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type SolidParticle } from "@babylonjs/core/Particles/solidParticle";
import { SolidParticleSystem } from "@babylonjs/core/Particles/solidParticleSystem";
import { type Scene } from "@babylonjs/core/scene";
//import { getForwardDirection } from "@/frontend/helpers/transform";

import { type Transformable } from "../../universe/architecture/transformable";

/**
 * @see https://playground.babylonjs.com/#GLZ1PX#1241 (SPS)
 * @see https://playground.babylonjs.com/#EAZYXZ#83 (Particle system)
 * @see https://playground.babylonjs.com/#W9LE0U#28
 */
export class WarpTunnel implements Transformable {
    readonly solidParticleSystem: SolidParticleSystem;

    private throttle = 0;

    static TUNNEL_LENGTH = 300;

    static MAX_NB_PARTICLES = 3000;

    private nbParticlesAlive = 0;
    private targetNbParticles = 0;

    private recycledParticles: SolidParticle[] = [];

    private readonly particleScaling = new Vector3(0.1, 0.1, 4);

    private readonly particleRotationQuaternion = Quaternion.Identity();

    private readonly particleDirection = Vector3.Zero();

    private readonly particleToDirection = new Map<SolidParticle, Vector3>();

    private readonly tunnelAxis1 = Vector3.Zero();
    private readonly tunnelAxis2 = Vector3.Zero();

    private particleSpeed = 200;

    private emitPeriod = 1;
    private emitCounter = 0;

    private currentForce = Vector3.Zero();

    private lastDeltaSeconds = 0;

    constructor(scene: Scene) {
        const SPS = new SolidParticleSystem("SPS", scene);
        const poly = MeshBuilder.CreatePolyhedron("p", { type: 1 });
        SPS.addShape(poly, WarpTunnel.MAX_NB_PARTICLES);
        poly.setEnabled(false);
        poly.dispose(); //dispose of original model poly

        SPS.buildMesh(); // finally builds and displays the SPS mesh
        SPS.isAlwaysVisible = true;

        this.solidParticleSystem = SPS;

        this.updateGlobals();

        SPS.recycleParticle = (particle: SolidParticle) => {
            this.recycledParticles.push(particle);
            particle.isVisible = false;

            return particle;
        };

        // initiate particles function
        SPS.initParticles = () => {
            for (const particle of SPS.particles) {
                this.initParticle(particle);
                if (this.nbParticlesAlive >= this.targetNbParticles) {
                    SPS.recycleParticle(particle);
                } else {
                    this.nbParticlesAlive++;
                }
            }
        };

        //Update SPS mesh
        SPS.initParticles();
        SPS.setParticles();

        const mat = new StandardMaterial("mat", scene);
        mat.emissiveColor = new Color3(1, 1, 1);
        mat.disableLighting = true;
        SPS.mesh.material = mat;

        SPS.updateParticle = (particle) => {
            if (!particle.isVisible) return particle;

            particle.velocity.addInPlace(this.currentForce.scale(this.lastDeltaSeconds));

            particle.position.addInPlace(particle.velocity.scale(this.lastDeltaSeconds));

            const relativePosition = particle.position; //.subtract(this.parent.position);
            const localZ = relativePosition.z; //.dot(this.spaceshipForward);

            if (localZ > WarpTunnel.TUNNEL_LENGTH / 2) {
                SPS.recycleParticle(particle);
                this.nbParticlesAlive--;
                return particle;
            }

            const progression =
                1.0 - RangeToPercent(localZ, -WarpTunnel.TUNNEL_LENGTH / 2, WarpTunnel.TUNNEL_LENGTH / 2);

            if (progression < 0.5) {
                const t = progression / 0.5;
                particle.color = Color4.Lerp(new Color4(0.7, 0.7, 1, 1), new Color4(0.7, 1, 1, 1), t);
                particle.scaling = Vector3.Lerp(Vector3.Zero(), this.particleScaling, Math.min(t * 2, 1));
            } else {
                const t = (progression - 0.5) / 0.5;
                particle.color = Color4.Lerp(new Color4(0.7, 1, 1, 1), new Color4(1, 1, 1, 1), t);
                particle.scaling = Vector3.Lerp(this.particleScaling, Vector3.Zero(), t * t);
            }

            return particle;
        };
    }

    private initParticle(particle: SolidParticle) {
        const r = 30 + (Math.random() - 0.5) * 10;
        const theta = Math.random() * 2 * Math.PI;

        particle.position.setAll(0);
        particle.position.addInPlace(this.tunnelAxis1.scale(r * Math.cos(theta)));
        particle.position.addInPlace(this.tunnelAxis2.scale(r * Math.sin(theta)));
        particle.position.addInPlace(this.particleDirection.scale(Math.random() * 10));
        particle.position.z -= WarpTunnel.TUNNEL_LENGTH / 2;

        this.particleToDirection.set(particle, this.particleDirection.clone());

        particle.rotationQuaternion = this.particleRotationQuaternion;

        particle.scaling = this.particleScaling;

        const particleDirection = this.particleToDirection.get(particle) ?? this.particleDirection;
        this.particleToDirection.set(particle, particleDirection);

        particle.velocity.copyFrom(particleDirection.scale(this.particleSpeed));
    }

    private updateGlobals() {
        this.particleRotationQuaternion.copyFrom(Quaternion.Identity());
        this.particleDirection.copyFromFloats(0, 0, 1);

        this.tunnelAxis1.copyFrom(this.particleDirection.add(new Vector3(Math.random(), Math.random(), Math.random())));
        this.tunnelAxis1.subtractInPlace(this.particleDirection.scale(this.tunnelAxis1.dot(this.particleDirection)));
        this.tunnelAxis1.normalize();

        this.tunnelAxis2.copyFrom(Vector3.Cross(this.particleDirection, this.tunnelAxis1));
        this.tunnelAxis2.normalize();
    }

    private instanceFromStock() {
        const particle = this.recycledParticles.shift();
        if (particle === undefined) {
            throw new Error("particle is undefined");
        }
        particle.isVisible = true;
        this.initParticle(particle);
    }

    public applyForce(force: Vector3) {
        this.currentForce.addInPlace(force);
    }

    update(deltaSeconds: number) {
        this.lastDeltaSeconds = deltaSeconds;

        this.particleSpeed = 200 * (1 + this.throttle);

        this.updateGlobals();

        if (this.targetNbParticles > 0) {
            this.emitPeriod = WarpTunnel.TUNNEL_LENGTH / (this.particleSpeed * this.targetNbParticles);

            this.emitCounter += deltaSeconds;

            while (
                this.emitCounter > this.emitPeriod &&
                this.nbParticlesAlive < this.targetNbParticles &&
                this.recycledParticles.length > 0
            ) {
                this.emitCounter -= this.emitPeriod;
                this.instanceFromStock();
                this.nbParticlesAlive++;
            }
        }

        // prevent counter from growing indefinitely
        this.emitCounter = this.emitCounter % this.emitPeriod;

        if (this.nbParticlesAlive === 0 && this.solidParticleSystem.mesh.isEnabled()) {
            this.solidParticleSystem.mesh.setEnabled(false);
        } else if (this.nbParticlesAlive > 0 && !this.solidParticleSystem.mesh.isEnabled()) {
            this.solidParticleSystem.mesh.setEnabled(true);
        }

        if (this.nbParticlesAlive > 0) this.solidParticleSystem.setParticles();
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
        this.targetNbParticles =
            throttle === 0 ? 0 : Math.floor(Math.max(this.throttle, 0.1) * WarpTunnel.MAX_NB_PARTICLES);
    }

    getTransform(): TransformNode {
        return this.solidParticleSystem.mesh;
    }

    dispose() {
        this.solidParticleSystem.dispose();
        this.particleToDirection.clear();
    }
}
