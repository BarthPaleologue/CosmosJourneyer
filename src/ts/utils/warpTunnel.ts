import { Scene } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Assets } from "../assets";
import { Transformable } from "../architecture/transformable";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Nullable } from "@babylonjs/core";

/**
 * @see https://playground.babylonjs.com/#EAZYXZ#83
 * @see https://playground.babylonjs.com/#W9LE0U#28
 */
export class WarpTunnel implements Transformable {
    readonly anchor: TransformNode;
    readonly particleSystem: ParticleSystem;

    static MAX_EMIT_RATE = 500;

    constructor(direction: Vector3, scene: Scene) {
        this.anchor = new TransformNode("anchor", scene);
        this.anchor.position = new Vector3(0, 0, 300);
        this.anchor.rotation.x = -Math.PI / 2;

        const ps = new ParticleSystem("WarpSpeed", 10_000, scene);
        ps.particleTexture = Assets.FlareTexture;
        ps.minLifeTime = 4;
        ps.maxLifeTime = 4;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;
        ps.forceDepthWrite = true;
        ps.minEmitPower = 100;
        ps.maxEmitPower = 100;
        ps.updateSpeed = 1 / 60; //0.005;
        ps.emitRate = 0;
        ps.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED;
        ps.minSize = 0.5;
        ps.maxSize = 0.5;
        ps.minScaleY = ps.maxScaleY = 10;

        ps.emitter = this.anchor as AbstractMesh;
        ps.start();

        ps.startPositionFunction = (worldMatrix, positionToUpdate, particle) => {
            const theta = Math.random() * Math.PI * 2;
            const r = 25 + (Math.random() - 0.5) * 2 * 10;

            const x = Math.cos(theta) * r;
            const y = Math.random();
            const z = Math.sin(theta) * r;

            Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, worldMatrix, positionToUpdate);
        };

        ps.startDirectionFunction = (worldMatrix, directionToUpdate, particle) => {
            const parent = this.getTransform().parent as Nullable<TransformNode>;
            if (parent === null) throw new Error("WarpTunnel anchor has no parent");
            const direction = parent.getAbsolutePosition().subtract(this.anchor.getAbsolutePosition()).normalize();
            directionToUpdate.copyFrom(direction);
        };

        function computeColor(t: number) {
            const t0 = -0.7;
            const t1 = 0.7;
            if(t < -1) {
                return new Color4(2, 2, 2, 0);
            }
            if(t < t0) {
                return new Color4(2, 2, 2, 1 - (t0 - t) / (t0 - -1));
            }
            if(t < t1) {
                return new Color4(2, 2, 2, 1);
            }
            if(t < 1) {
                return new Color4(2, 2, 2, 1 - (t - t1) / (1 - t1));
            }
            if(t > 1) {
                return new Color4(2, 2, 2, 0);
            }
            throw new Error("Invalid t: " + t);
        }

        ps.updateFunction = (particles) => {
            const parent = this.getTransform().parent as Nullable<TransformNode>;
            if (parent === null) throw new Error("WarpTunnel anchor has no parent");
            const parentForward = getForwardDirection(parent);
            for (let index = 0; index < particles.length; index++) {
                const deltaTime = scene.getEngine().getDeltaTime() / 1000;
                const scaledUpdateSpeed = deltaTime * ps.updateSpeed * 60;

                const particle = particles[index];
                particle.age += scaledUpdateSpeed;

                const scaledDirection = particle.direction.scale(scaledUpdateSpeed);

                if (particle.age >= particle.lifeTime) {
                    // Recycle
                    particles.splice(index, 1);
                    //@ts-ignore
                    ps._stockParticles.push(particle);
                    index--;
                    continue;
                }

                const distanceAlongForward = particle.position.dot(parentForward);

                const distanceAlongForward11 = distanceAlongForward / 300;

                particle.color = computeColor(distanceAlongForward11);

                particle.direction.scaleToRef(scaledUpdateSpeed, scaledDirection);
                particle.position.addInPlace(scaledDirection);

                particle.position.addInPlace(scaledDirection);
            }
        };

        /*let lastEmitterPosition = this.anchor.getAbsolutePosition().clone();
        scene.onBeforeParticlesRenderingObservable.add(() => {
            const newEmitterPosition = this.anchor.getAbsolutePosition().clone();
            ps.particles.forEach(particle => {
                particle.position.addInPlace(newEmitterPosition.subtract(lastEmitterPosition));

            });
            lastEmitterPosition = newEmitterPosition.clone();
        });*/

        this.particleSystem = ps;
    }

    setThrottle(throttle: number) {
        this.particleSystem.emitRate = throttle * WarpTunnel.MAX_EMIT_RATE;
    }

    getTransform(): TransformNode {
        return this.anchor;
    }

    dispose() {
        this.particleSystem.dispose();
        this.anchor.dispose();
    }
}
