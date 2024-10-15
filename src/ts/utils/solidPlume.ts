import { SolidParticleSystem } from "@babylonjs/core/Particles/solidParticleSystem";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SolidParticle } from "@babylonjs/core/Particles/solidParticle";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes";

export class SolidPlume {
    static TUNNEL_LENGTH = 3;
    static MAX_NB_PARTICLES = 2000;

    targetNbParticles = 0;
    nbParticles = 0;

    direction = Axis.Z;

    recycledParticles: SolidParticle[] = [];

    SPS: SolidParticleSystem;

    private nbSubTimeSteps = 1;
    private subTimeStep = 0;

    constructor(engineAnchor: TransformNode, scene: Scene) {
        this.SPS = new SolidParticleSystem("SPS", scene);
        const poly = MeshBuilder.CreatePolyhedron("p", { type: 1 });
        this.SPS.addShape(poly, SolidPlume.MAX_NB_PARTICLES);

        // trying to get rid of polygon
        // poly.setEnabled(false);
        // poly.visibility = 0;
        poly.dispose(); //dispose of original model poly

        this.SPS.buildMesh(); // finally builds and displays the SPS mesh
        this.SPS.isAlwaysVisible = true;

        const scaling = new Vector3(0.01, 0.01, 0.1);

        // initiate particles function
        this.SPS.initParticles = () => {
            for (let p = 0; p < this.SPS.nbParticles; p++) {
                const particle = this.SPS.particles[p];
                this.initParticle(particle);
                if (this.nbParticles >= this.targetNbParticles) {
                    // particle.alive = false;
                    particle.isVisible = false;
                    this.recycledParticles.push(particle);
                    // console.log('set particle', particle.name, 'as not alive');
                } else {
                    this.nbParticles++;
                }
                particle.position.z = Scalar.RandomRange(0, SolidPlume.TUNNEL_LENGTH);
            }
        };

        //Update SPS mesh
        this.SPS.initParticles();
        this.SPS.setParticles();

        const mat = new StandardMaterial("mat", scene);
        mat.emissiveColor = new Color3(1, 1, 1);
        mat.disableLighting = true;
        this.SPS.mesh.material = mat;

        this.SPS.updateParticle = (particle) => {
            // console.log('particle', particle.name, 'alive', particle.alive);
            if (!particle.alive) return particle;
            if (!particle.isVisible) return particle;
            particle.position.addInPlace(particle.velocity.scale(10 * this.subTimeStep));

            const localZ = particle.position.z;

            // if particle has gone too far, recycle or reset depending on current need
            if (localZ > SolidPlume.TUNNEL_LENGTH) {
                if (this.nbParticles <= this.targetNbParticles) {
                    this.initParticle(particle);
                } else {
                    this.recycledParticles.push(particle);
                    particle.isVisible = false;
                    //particle.alive = false;
                    this.nbParticles--;

                    return particle;
                }
            }

            // update color and scaling

            const progression = Scalar.RangeToPercent(localZ, 0, SolidPlume.TUNNEL_LENGTH);

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

        this.SPS.mesh.parent = engineAnchor;
        this.SPS.mesh.scaling.z = -1;
    }

    private initParticle(particle: SolidParticle) {
        const r = Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;

        const position = new Vector3(r * Math.cos(theta), r * Math.sin(theta), Math.random() * SolidPlume.TUNNEL_LENGTH);

        particle.position.copyFrom(position);

        particle.velocity.copyFrom(this.direction.scale(2));

        // particle.scaling = scaling;
        particle.scaling = new Vector3(0, 0, 0);
    }

    setThrottle(throttle: number) {
        this.targetNbParticles = Math.floor(SolidPlume.MAX_NB_PARTICLES * throttle);
    }

    update(deltaSeconds: number) {
        if (this.targetNbParticles === 0 && this.nbParticles === 0) {
            return;
        }

        this.subTimeStep = deltaSeconds / this.nbSubTimeSteps;
        for (let i = 0; i < this.nbSubTimeSteps; i++) {
            // if there aren't enough particles, instantiate more
            for (let j = 0; j < 10; j++) {
                if (this.nbParticles < this.targetNbParticles && this.recycledParticles.length > 0) {
                    const particle = this.recycledParticles.shift() as SolidParticle;
                    // particle.alive = true;
                    particle.isVisible = true;
                    // console.log('make particle', particle.name, 'alive');
                    this.initParticle(particle);
                    this.nbParticles++;
                }
            }

            this.SPS.setParticles();
        }
    }
}
