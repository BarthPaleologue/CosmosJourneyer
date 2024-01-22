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
        ps.minLifeTime = 2;
        ps.maxLifeTime = 2;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;
        ps.forceDepthWrite = true;
        ps.minEmitPower = 200;
        ps.maxEmitPower = 200;
        ps.updateSpeed = 1 / 60;
        ps.emitRate = 0;
        ps.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED;
        ps.minSize = 0.5;
        ps.maxSize = 0.5;
        ps.minScaleY = ps.maxScaleY = 10;

        ps.addColorGradient(0, new Color4(0, 0, 1, 0.0));
        ps.addColorGradient(0.25, new Color4(0, 1, 1, 1));
        ps.addColorGradient(1, new Color4(1, 0, 1, 0));

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

        const lastParentPosition = Vector3.Zero();

        scene.onBeforeParticlesRenderingObservable.add(() => {
            const parent = this.getTransform().parent as Nullable<TransformNode>;
            if (parent === null) throw new Error("WarpTunnel anchor has no parent");

            const newParentPosition = parent.getAbsolutePosition().clone();
            const parentDisplacement = newParentPosition.subtract(lastParentPosition);

            if(parentDisplacement.length() > 0) {
                console.log(parentDisplacement.length());
            }
            ps.particles.forEach(particle => {
                particle.position.addInPlace(parentDisplacement);
            });
            lastParentPosition.copyFrom(newParentPosition);
        });

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
