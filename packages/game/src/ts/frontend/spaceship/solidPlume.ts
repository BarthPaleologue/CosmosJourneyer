import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { RangeToPercent } from "@babylonjs/core/Maths/math.scalar.functions";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type SolidParticle } from "@babylonjs/core/Particles/solidParticle";
import { SolidParticleSystem } from "@babylonjs/core/Particles/solidParticleSystem";
import { type Scene } from "@babylonjs/core/scene";

export class SolidPlume {
    static TUNNEL_LENGTH = 5;
    static MAX_NB_PARTICLES = 2000;
    static PLUME_RADIUS = 1.5;

    private targetNbParticles = 0;
    private nbParticlesAlive = 0;

    readonly direction = Axis.Z;

    private particleSpeed = 50;

    readonly recycledParticles: SolidParticle[] = [];

    readonly solidParticleSystem: SolidParticleSystem;

    private emitPeriod = 1;
    private emitCounter = 0;

    private lastDeltaSeconds = 0;

    constructor(engineAnchor: TransformNode, scene: Scene) {
        this.solidParticleSystem = new SolidParticleSystem("SPS", scene);
        const poly = MeshBuilder.CreatePolyhedron("p", { type: 1 });
        this.solidParticleSystem.addShape(poly, SolidPlume.MAX_NB_PARTICLES);

        // trying to get rid of polygon
        // poly.setEnabled(false);
        // poly.visibility = 0;
        poly.dispose(); //dispose of original model poly

        this.solidParticleSystem.buildMesh(); // finally builds and displays the SPS mesh
        this.solidParticleSystem.isAlwaysVisible = true;

        const scaling = new Vector3(0.01, 0.01, 0.1);

        // initiate particles function
        this.solidParticleSystem.initParticles = () => {
            for (const particle of this.solidParticleSystem.particles) {
                this.initParticle(particle);
                if (this.nbParticlesAlive >= this.targetNbParticles) {
                    // particle.alive = false;
                    particle.isVisible = false;
                    this.recycledParticles.push(particle);
                    // console.log('set particle', particle.name, 'as not alive');
                } else {
                    this.nbParticlesAlive++;
                }
                particle.position.z = Scalar.RandomRange(0, SolidPlume.TUNNEL_LENGTH);
            }
        };

        //Update SPS mesh
        this.solidParticleSystem.initParticles();
        this.solidParticleSystem.setParticles();

        const mat = new StandardMaterial("mat", scene);
        mat.emissiveColor = new Color3(1, 1, 1);
        mat.disableLighting = true;
        this.solidParticleSystem.mesh.material = mat;

        this.solidParticleSystem.updateParticle = (particle) => {
            // console.log('particle', particle.name, 'alive', particle.alive);
            if (!particle.alive) return particle;
            if (!particle.isVisible) return particle;
            particle.position.addInPlace(particle.velocity.scale(this.lastDeltaSeconds));

            const localZ = particle.position.z;

            // if particle has gone too far, recycle or reset depending on current need
            if (localZ > SolidPlume.TUNNEL_LENGTH) {
                if (this.nbParticlesAlive <= this.targetNbParticles) {
                    this.initParticle(particle);
                } else {
                    this.recycledParticles.push(particle);
                    particle.isVisible = false;
                    //particle.alive = false;
                    this.nbParticlesAlive--;

                    return particle;
                }
            }

            // update color and scaling

            const progression = RangeToPercent(localZ, 0, SolidPlume.TUNNEL_LENGTH);

            if (progression < 0.5) {
                const t = progression / 0.5;
                particle.color = Color4.Lerp(new Color4(0, 0, 1, 1), new Color4(0, 1, 1, 1), t);
                particle.scaling = scaling; //Vector3.Lerp(Vector3.Zero(), scaling, Math.min(t * 2, 1));
            } else {
                const t = (progression - 0.5) / 0.5;
                particle.color = Color4.Lerp(new Color4(0, 1, 1), new Color4(1, 0, 1), t);
                particle.scaling = Vector3.Lerp(scaling, Vector3.Zero(), t * t);
            }
            // console.log('particle scaling is', particle.scaling.toString());

            return particle;
        };

        this.solidParticleSystem.mesh.scaling.z = -1;
    }

    private initParticle(particle: SolidParticle) {
        const r = SolidPlume.PLUME_RADIUS * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;

        const position = new Vector3(
            r * Math.cos(theta),
            r * Math.sin(theta),
            Math.random() * SolidPlume.TUNNEL_LENGTH,
        );

        particle.position.copyFrom(position);

        particle.velocity.copyFrom(this.direction.scale(this.particleSpeed));

        // particle.scaling = scaling;
        particle.scaling = new Vector3(0, 0, 0);
    }

    setThrottle(throttle: number) {
        this.targetNbParticles = Math.floor(SolidPlume.MAX_NB_PARTICLES * throttle);
    }

    private instanceFromStock() {
        const particle = this.recycledParticles.shift();
        if (particle === undefined) {
            throw new Error("particle is undefined");
        }
        particle.isVisible = true;
        this.initParticle(particle);
    }

    update(deltaSeconds: number) {
        this.lastDeltaSeconds = deltaSeconds;

        if (this.targetNbParticles > 0) {
            this.emitPeriod = SolidPlume.TUNNEL_LENGTH / (this.particleSpeed * this.targetNbParticles);

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
}
