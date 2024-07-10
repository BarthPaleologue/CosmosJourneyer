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

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SolidParticle } from "@babylonjs/core/Particles/solidParticle";
import { SolidParticleSystem } from "@babylonjs/core/Particles/solidParticleSystem";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";

/**
 * @see https://playground.babylonjs.com/#GLZ1PX#1241 (SPS)
 * @see https://playground.babylonjs.com/#EAZYXZ#83 (Particle system)
 * @see https://playground.babylonjs.com/#W9LE0U#28
 */
export class WarpTunnel implements Transformable {
    readonly anchor: TransformNode;
    readonly parent: TransformNode;

    readonly solidParticleSystem: SolidParticleSystem;

    private throttle = 0;

    static TUNNEL_LENGTH = 300;

    static MAX_NB_PARTICLES = 3000;

    private nbParticlesAlive = 0;
    private targetNbParticles = 0;

    private recycledParticles: SolidParticle[] = [];

    constructor(parent: TransformNode, scene: Scene) {
        this.anchor = new TransformNode("anchor", scene);
        this.anchor.position = new Vector3(0, 0, WarpTunnel.TUNNEL_LENGTH);
        this.anchor.rotationQuaternion = Quaternion.Identity();
        this.anchor.computeWorldMatrix(true);

        this.anchor.parent = parent;
        this.parent = parent;

        const SPS = new SolidParticleSystem("SPS", scene);
        const poly = MeshBuilder.CreatePolyhedron("p", { type: 1 });
        SPS.addShape(poly, WarpTunnel.MAX_NB_PARTICLES);
        poly.setEnabled(false);
        poly.dispose(); //dispose of original model poly

        SPS.buildMesh(); // finally builds and displays the SPS mesh
        SPS.isAlwaysVisible = true;

        this.solidParticleSystem = SPS;

        const direction = Vector3.Zero();
        const v0 = Vector3.Zero();
        const v1 = Vector3.Zero();
        const scaling = new Vector3(0.1, 0.1, 4);
        const rotationQuaternion = this.anchor.absoluteRotationQuaternion;
        const spaceshipForward = getForwardDirection(this.parent);
        const spaceshipDisplacement = Vector3.Zero();

        const updateGlobals = () => {
            direction.copyFrom(this.parent.getAbsolutePosition().subtract(this.anchor.getAbsolutePosition()).normalize());

            v0.copyFrom(direction.add(new Vector3(Math.random(), Math.random(), Math.random())));
            v0.subtractInPlace(direction.scale(v0.dot(direction)));
            v0.normalize();

            v1.copyFrom(Vector3.Cross(direction, v0));
            v1.normalize();

            rotationQuaternion.copyFrom(this.anchor.absoluteRotationQuaternion);
        };

        updateGlobals();

        const initParticle = (particle: SolidParticle) => {
            const r = 30 + (Math.random() - 0.5) * 10;
            const theta = Math.random() * 2 * Math.PI;

            particle.position.setAll(0);
            particle.position.addInPlace(v0.scale(r * Math.cos(theta)));
            particle.position.addInPlace(v1.scale(r * Math.sin(theta)));
            particle.position.addInPlace(direction.scale(Math.random() * 10));
            particle.position.addInPlace(this.anchor.getAbsolutePosition());

            particle.props = {
                direction: direction.clone()
            };

            particle.rotationQuaternion = rotationQuaternion;

            particle.scaling = scaling;
        };

        SPS.recycleParticle = (particle: SolidParticle) => {
            this.recycledParticles.push(particle);
            particle.isVisible = false;

            return particle;
        };

        const instanceFromStock = () => {
            const particle = this.recycledParticles.shift();
            if (particle === undefined) {
                throw new Error("particle is undefined");
            }
            particle.isVisible = true;
            initParticle(particle);
        };

        // initiate particles function
        SPS.initParticles = () => {
            for (let p = 0; p < SPS.nbParticles; p++) {
                const particle = SPS.particles[p];

                initParticle(particle);
                if (this.nbParticlesAlive >= this.targetNbParticles) {
                    SPS.recycleParticle(particle);
                } else {
                    this.nbParticlesAlive++;
                }
                particle.position.z = Scalar.RandomRange(-WarpTunnel.TUNNEL_LENGTH / 2, WarpTunnel.TUNNEL_LENGTH);
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

            particle.velocity.copyFrom(particle.props.direction.scale(400 + 400 * this.throttle));

            particle.position.addInPlace(particle.velocity.scale(scene.getEngine().getDeltaTime() / 1000));
            particle.position.addInPlace(spaceshipDisplacement);

            const relativePosition = particle.position.subtract(this.parent.position);
            const localZ = relativePosition.dot(spaceshipForward);

            if (localZ < -WarpTunnel.TUNNEL_LENGTH / 2 || relativePosition.length() > WarpTunnel.TUNNEL_LENGTH) {
                if (this.nbParticlesAlive <= this.targetNbParticles) {
                    initParticle(particle);
                } else {
                    SPS.recycleParticle(particle);
                    this.nbParticlesAlive--;

                    return particle;
                }
            }

            const progression = 1.0 - Scalar.RangeToPercent(localZ, -WarpTunnel.TUNNEL_LENGTH / 2, WarpTunnel.TUNNEL_LENGTH);

            if (progression < 0.5) {
                const t = progression / 0.5;
                particle.color = Color4.Lerp(new Color4(0, 0, 1, 1), new Color4(0, 1, 1, 1), t);
                particle.scaling = Vector3.Lerp(Vector3.Zero(), scaling, Math.min(t * 2, 1));
            } else {
                const t = (progression - 0.5) / 0.5;
                particle.color = Color4.Lerp(new Color4(0, 1, 1, 1), new Color4(1, 0, 1, 1), t);
                particle.scaling = Vector3.Lerp(scaling, Vector3.Zero(), t * t);
            }

            return particle;
        };

        const oldShipPosition = Vector3.Zero();
        scene.onBeforeRenderObservable.add(() => {
            const newShipPosition = this.parent.getAbsolutePosition().clone();

            spaceshipDisplacement.copyFrom(newShipPosition.subtract(oldShipPosition));

            oldShipPosition.copyFrom(newShipPosition);

            spaceshipForward.copyFrom(getForwardDirection(parent));

            updateGlobals();

            if (this.nbParticlesAlive < this.targetNbParticles && this.recycledParticles.length > 0) {
                if (Math.random() < this.targetNbParticles / WarpTunnel.MAX_NB_PARTICLES) {
                    instanceFromStock();
                    this.nbParticlesAlive++;
                }
            }

            if (this.nbParticlesAlive === 0 && SPS.mesh.isEnabled()) {
                SPS.mesh.setEnabled(false);
            } else if (this.nbParticlesAlive > 0 && !SPS.mesh.isEnabled()) {
                SPS.mesh.setEnabled(true);
            }

            if (this.nbParticlesAlive > 0) SPS.setParticles();
        });
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
        this.targetNbParticles = throttle === 0 ? 0 : Math.floor(Math.max(this.throttle, 0.1) * WarpTunnel.MAX_NB_PARTICLES);
    }

    getTransform(): TransformNode {
        return this.anchor;
    }

    dispose() {
        this.solidParticleSystem.dispose();
        this.anchor.dispose();
    }
}
