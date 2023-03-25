import { Vector3 } from "@babylonjs/core/Maths/math";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Assets } from "../assets";
import { Particle } from "@babylonjs/core/Particles/particle";

function randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export class DirectionnalParticleSystem extends ParticleSystem {

    private direction: Vector3;

    readonly nbParticles = 5000;

    readonly particleVelocities: Vector3[] = new Array(this.nbParticles);

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
        this.minLifeTime = 0.5;
        this.maxLifeTime = 0.6;
        this.minEmitPower = 11;
        this.maxEmitPower = 12;
        this.updateSpeed = 0.005;
        this.color1 = new Color4(0.5, 0.5, 0.5, 1);
        this.color2 = new Color4(0.5, 0.5, 0.5, 1);
        this.colorDead = new Color4(0, 0, 0, 0);
        this.direction1 = direction;
        this.direction2 = direction;
        this.start();

        this.startPositionFunction = (worldMatrix, positionToUpdate, particle: Particle, isLocal): void => {
            const randX = randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
            const randY = randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
            const randZ = randomNumber(this.minEmitBox.z, this.maxEmitBox.z);

            this.particleVelocities[particle.id] = this.direction.scale(3);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        };

        this.updateFunction = (particles) => {
            const deltaTime = this.getScene()!.getEngine().getDeltaTime() / 1000;
            const scaledUpdateSpeed = deltaTime * this.updateSpeed * 60;
            const scaledColorStep = this.color1.subtract(this.colorDead).scale(scaledUpdateSpeed);
            const scaledDirection = this.direction.scale(scaledUpdateSpeed);
            const scaledAcceleration = this.currentAcceleration.scale(deltaTime);

            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];

                particle.age += scaledUpdateSpeed;

                if (particle.age >= particle.lifeTime) {
                    // Recycle
                    this.recycleParticle(particle);
                    i--;
                    continue;
                } else {
                    const velocity = this.particleVelocities[particle.id];
                    velocity.addInPlace(scaledAcceleration);

                    particle.colorStep.scaleToRef(scaledUpdateSpeed, scaledColorStep);
                    particle.color.addInPlace(scaledColorStep);

                    if (particle.color.a < 0) particle.color.a = 0;
                    particle.angle += particle.angularSpeed * scaledUpdateSpeed;

                    particle.direction.scaleToRef(scaledUpdateSpeed, scaledDirection);

                    particle.position.addInPlace(velocity.scale(deltaTime));
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