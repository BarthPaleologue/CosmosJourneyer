import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Assets } from "../assets";

function randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export class DirectionnalParticleSystem extends ParticleSystem {

    private direction: Vector3;

    readonly particleVelocities: Map<number, Vector3> = new Map();

    private currentAcceleration: Vector3 = Vector3.Zero();

    constructor(mesh: AbstractMesh, direction: Vector3) {
        super("particles", 5000, mesh.getScene());

        this.direction = direction;

        this.particleTexture = Assets.GrassNormalMap;
        this.emitter = mesh;
        this.minSize = 0.6;
        this.maxSize = 0.7;
        this.useLogarithmicDepth = true;
        this.emitRate = 100;
        this.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        this.minLifeTime = 1;
        this.maxLifeTime = 2;
        this.minEmitPower = 11;
        this.maxEmitPower = 12;
        this.updateSpeed = 0.005;
        this.color1 = new Color4(0.5, 0.5, 0.5, 1);
        this.color2 = new Color4(0.5, 0.5, 0.5, 1);
        this.colorDead = new Color4(0, 0, 0, 0);
        this.direction1 = direction;
        this.direction2 = direction;
        this.start();

        this.startPositionFunction = (worldMatrix, positionToUpdate, particle, isLocal): void => {
            var randX = randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
            var randY = randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
            var randZ = randomNumber(this.minEmitBox.z, this.maxEmitBox.z);

            this.particleVelocities.set(particle.id, this.direction.scale(3));

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        };

        this.updateFunction = (particles) => {
            const deltaTime = this.getScene()!.getEngine().getDeltaTime() / 1000;
            const scaledUpdateSpeed = deltaTime * this.updateSpeed * 60;

            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];

                particle.age += scaledUpdateSpeed;

                if (particle.age >= particle.lifeTime) {
                    // Recycle
                    this.recycleParticle(particle);
                    i--;
                    continue;
                } else {
                    const velocity = this.particleVelocities.get(particle.id) || Vector3.Zero();
                    const newVelocity = velocity.add(this.currentAcceleration.scale(deltaTime));
                    this.particleVelocities.set(particle.id, newVelocity);

                    //@ts-ignore
                    particle.colorStep.scaleToRef(scaledUpdateSpeed, this._scaledColorStep);
                    //@ts-ignore
                    particle.color.addInPlace(this._scaledColorStep);

                    if (particle.color.a < 0) particle.color.a = 0;
                    particle.angle += particle.angularSpeed * scaledUpdateSpeed;
                    //@ts-ignore
                    particle.direction.scaleToRef(scaledUpdateSpeed, this._scaledDirection);

                    particle.position.addInPlace(newVelocity.scale(deltaTime));
                }
            }
        };
    }

    public applyAcceleration(acceleration: Vector3) {
        this.currentAcceleration = acceleration;
    }

    public setDirection(newDirection: Vector3) {
        this.direction = newDirection;
    }
}