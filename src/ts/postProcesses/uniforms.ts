import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { StarSystem } from "../bodies/starSystem";
import { Vector4 } from "@babylonjs/core";
import { AbstractBody } from "../bodies/abstractBody";

export function getActiveCameraUniforms(scene: UberScene): ShaderUniforms {
    return [
        {
            name: "cameraPosition",
            type: ShaderDataType.Vector3,
            get: () => {
                return scene.getActiveUberCamera().position;
            }
        },
        {
            name: "projection",
            type: ShaderDataType.Matrix,
            get: () => {
                return scene.getActiveUberCamera().getProjectionMatrix();
            }
        },
        {
            name: "inverseProjection",
            type: ShaderDataType.Matrix,
            get: () => {
                return scene.getActiveUberCamera().getInverseProjectionMatrix();
            }
        },
        {
            name: "view",
            type: ShaderDataType.Matrix,
            get: () => {
                return scene.getActiveUberCamera().getViewMatrix();
            }
        },
        {
            name: "inverseView",
            type: ShaderDataType.Matrix,
            get: () => {
                return scene.getActiveUberCamera().getInverseViewMatrix();
            }
        },
        {
            name: "cameraNear",
            type: ShaderDataType.Float,
            get: () => {
                return scene.getActiveUberCamera().minZ;
            }
        },
        {
            name: "cameraFar",
            type: ShaderDataType.Float,
            get: () => {
                return scene.getActiveUberCamera().maxZ;
            }
        }];
}

export function getStarsUniforms(starSystem: StarSystem): ShaderUniforms {
    return [
        {
            name: "starPositions",
            type: ShaderDataType.Vector3Array,
            get: () => {
                return starSystem.stars.map((star) => star.getAbsolutePosition());
            }
        },
        {
            name: "nbStars",
            type: ShaderDataType.Int,
            get: () => {
                return starSystem.stars.length;
            }
        }
    ];
}

export function getPlanetsUniforms(starSystem: StarSystem): ShaderUniforms {
    return [
        {
            name: "planetPositions",
            type: ShaderDataType.Vector4Array,
            get: () => {
                return starSystem.planets.map((planet) => {
                    const position = planet.getAbsolutePosition();
                    return new Vector4(position.x, position.y, position.z, planet.radius);
                });
            }
        },
        {
            name: "nbPlanets",
            type: ShaderDataType.Int,
            get: () => {
                return starSystem.planets.length;
            }
        }
    ]
}

export function getBodyUniforms(body: AbstractBody): ShaderUniforms {
    return [
        {
            name: "planetPosition",
            type: ShaderDataType.Vector3,
            get: () => {
                return body.getAbsolutePosition();
            }
        },
        {
            name: "planetRadius",
            type: ShaderDataType.Float,
            get: () => {
                return body.getApparentRadius();
            }
        }
    ]
}

export function getSamplers(scene: UberScene): ShaderSamplers {
    return [
        {
            name: "textureSampler",
            type: ShaderDataType.Auto,
            get: () => {
                return 0;
            }
        },
        {
            name: "depthSampler",
            type: ShaderDataType.Texture,
            get: () => {
                return scene.getActiveUberCamera().depthRenderer.getDepthMap();
            }
        }
    ];
}