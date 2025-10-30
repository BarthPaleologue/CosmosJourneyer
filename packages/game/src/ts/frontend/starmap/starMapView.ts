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

import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Culling/ray";

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { type Scene } from "@babylonjs/core/scene";

import { type EncyclopaediaGalactica } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { ItinerarySchema, type Itinerary } from "@/backend/player/serializedPlayer";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { CameraRadiusAnimation } from "@/frontend/helpers/animations/radius";
import { TransformRotationAnimation } from "@/frontend/helpers/animations/rotation";
import { TransformTranslationAnimation } from "@/frontend/helpers/animations/translation";
import { lookAt } from "@/frontend/helpers/transform";
import { type Player } from "@/frontend/player/player";
import { alertModal } from "@/frontend/ui/dialogModal";
import { NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";
import { type View } from "@/frontend/view";

import { type DeepReadonly } from "@/utils/types";

import { type StarMapTextures } from "../assets/textures/starMap";
import { type INotificationManager } from "../ui/notificationManager";
import { StarMap } from "./starMap";
import { StarMapControls } from "./starMapControls";
import { StarMapInputs } from "./starMapInputs";
import { StarMapUI } from "./starMapUI";
import { StellarPathfinder } from "./stellarPathfinder";
import { ThickLines } from "./thickLines";

// register cosmos journeyer as part of window object
declare global {
    interface Window {
        StarMap: StarMapView;
    }
}

export class StarMapView implements View {
    readonly scene: Scene;
    private readonly controls: StarMapControls;

    private rotationAnimation: TransformRotationAnimation | null = null;
    private translationAnimation: TransformTranslationAnimation | null = null;
    private radiusAnimation: CameraRadiusAnimation | null = null;

    private readonly player: Player;

    private readonly encyclopaedia: EncyclopaediaGalactica;

    private readonly universeBackend: UniverseBackend;

    private readonly starMapUI: StarMapUI;

    private selectedSystemCoordinates: StarSystemCoordinates | null = null;
    private currentSystemCoordinates: StarSystemCoordinates | null = null;

    private readonly travelLine: ThickLines;

    private readonly stellarPathfinder: StellarPathfinder;

    public readonly onTargetSetObservable: Observable<StarSystemCoordinates> = new Observable();

    private readonly soundPlayer: ISoundPlayer;
    private readonly notificationManager: INotificationManager;

    private readonly starMap: StarMap;

    constructor(
        player: Player,
        scene: Scene,
        assets: StarMapTextures,
        encyclopaedia: EncyclopaediaGalactica,
        universeBackend: UniverseBackend,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
    ) {
        this.scene = scene;
        this.scene.onDisposeObservable.addOnce(() => {
            this.starMapUI.dispose();
        });

        this.starMap = new StarMap(universeBackend, assets, this.scene);
        this.starMap.onSystemHoverStart.add((starSystemCoordinates) => {
            this.starMapUI.setHoveredSystem(starSystemCoordinates);
            this.soundPlayer.playNow(SoundType.HOVER);
        });
        this.starMap.onSystemHoverEnd.add(() => {
            this.starMapUI.setHoveredSystem(null);
        });
        this.starMap.onSystemPicked.add((starSystemCoordinates) => {
            const starSystemModel = this.universeBackend.getSystemModelFromCoordinates(starSystemCoordinates);
            if (starSystemModel === null) {
                throw new Error(
                    `Could not find star system model for coordinates ${JSON.stringify(starSystemCoordinates)}`,
                );
            }

            this.soundPlayer.playNow(SoundType.TARGET_LOCK);
            this.starMapUI.setSelectedSystem(starSystemModel, this.currentSystemCoordinates);
            this.selectedSystemCoordinates = starSystemCoordinates;
            this.focusOnSystem(starSystemCoordinates);
        });

        this.soundPlayer = soundPlayer;
        this.notificationManager = notificationManager;

        this.controls = new StarMapControls(this.scene);
        this.controls.getCameras().forEach((camera) => (camera.minZ = 0.01));

        this.controls.getActiveCamera().attachControl();

        this.player = player;

        this.encyclopaedia = encyclopaedia;
        this.universeBackend = universeBackend;

        this.stellarPathfinder = new StellarPathfinder(universeBackend);

        this.starMapUI = new StarMapUI(this.scene, this.player, this.universeBackend, this.soundPlayer);
        this.starMapUI.onSystemFocusObservable.add((starSystemCoordinates) => {
            this.focusOnSystem(starSystemCoordinates);
        });

        this.starMapUI.shortHandUIPlotItineraryButton.addEventListener("click", async () => {
            if (this.currentSystemCoordinates === null) {
                await alertModal("current system seed is null!", this.soundPlayer);
                return;
            }
            if (this.selectedSystemCoordinates === null) {
                await alertModal("selected system seed is null!", this.soundPlayer);
                return;
            }

            const playerCurrentSpaceship = this.player.instancedSpaceships.at(0);
            if (playerCurrentSpaceship === undefined) {
                await alertModal("You do not own a spaceship! What have you done???", this.soundPlayer);
                return;
            }

            const warpDrive = playerCurrentSpaceship.getInternals().getWarpDrive();

            if (warpDrive === null) {
                await alertModal(
                    "Your current spaceship has no warp drive! Install a warp drive to plot an itinerary.",
                    this.soundPlayer,
                );
                return;
            }

            const jumpRange = warpDrive.rangeLY;

            if (starSystemCoordinatesEquals(this.selectedSystemCoordinates, this.currentSystemCoordinates)) return;
            this.soundPlayer.playNow(SoundType.CLICK);
            this.stellarPathfinder.init(this.currentSystemCoordinates, this.selectedSystemCoordinates, jumpRange);
        });

        StarMapInputs.map.focusOnCurrentSystem.on("complete", () => {
            this.focusOnCurrentSystem();
        });

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, this.controls.getCameras());
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.5;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.exposure = 1.0;
        pipeline.imageProcessing.contrast = 1.0;

        this.travelLine = new ThickLines(
            "travelLine",
            {
                points: [],
                thickness: 0.05,
                color: Color3.Red(),
            },
            this.scene,
        );

        this.scene.onBeforeRenderObservable.add(async () => {
            const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;

            if (this.rotationAnimation !== null) this.rotationAnimation.update(deltaSeconds);
            if (this.translationAnimation !== null) this.translationAnimation.update(deltaSeconds);
            if (this.radiusAnimation !== null) this.radiusAnimation.update(deltaSeconds);

            this.controls.update(deltaSeconds);

            this.starMap.update(this.controls.getActiveCamera());

            // update pathfinder
            const pathfinderMaxIterations = 50_000;
            const pathfinderStepsPerFrame = 10;
            for (let i = 0; i < pathfinderStepsPerFrame; i++) {
                if (!this.stellarPathfinder.hasBeenInit()) break;
                if (this.stellarPathfinder.hasFoundPath()) break;
                if (this.stellarPathfinder.getNbIterations() >= pathfinderMaxIterations) break;

                this.stellarPathfinder.update();

                if (this.stellarPathfinder.hasFoundPath()) {
                    this.soundPlayer.playNow(SoundType.ITINERARY_COMPUTED);
                    const path = this.stellarPathfinder.getPath();
                    if (!path.success) {
                        await alertModal(path.error.message, this.soundPlayer);
                        continue;
                    }

                    const parsedItinerary = ItinerarySchema.safeParse(path.value);
                    if (parsedItinerary.success) {
                        this.drawPath(parsedItinerary.data);
                        this.player.currentItinerary = parsedItinerary.data;
                    } else {
                        this.notificationManager.create(
                            NotificationOrigin.GENERAL,
                            NotificationIntent.ERROR,
                            `Failed to parse itinerary: ${parsedItinerary.error.message}`,
                            5000,
                        );
                        this.player.currentItinerary = null;
                    }

                    const nextDestination = path.value[1];

                    if (nextDestination !== undefined) {
                        this.onTargetSetObservable.notifyObservers(nextDestination);
                    }
                } else if (this.stellarPathfinder.getNbIterations() >= pathfinderMaxIterations) {
                    this.notificationManager.create(
                        NotificationOrigin.GENERAL,
                        NotificationIntent.ERROR,
                        `Could not find a path to the target system after ${pathfinderMaxIterations} iterations`,
                        5000,
                    );
                }
            }

            if (this.stellarPathfinder.hasBeenInit() && !this.stellarPathfinder.hasFoundPath()) {
                this.starMapUI.shortHandUIPlotItineraryButton.classList.add("loading");
            } else {
                this.starMapUI.shortHandUIPlotItineraryButton.classList.remove("loading");
            }
        });

        this.scene.onAfterRenderObservable.add(() => {
            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) throw new Error("No active camera!");
            this.starMapUI.update(activeCamera.globalPosition);
        });

        window.StarMap = this;
    }

    private drawPath(path: DeepReadonly<Itinerary>) {
        const points = path.map((coordinates) => {
            return wrapVector3(this.universeBackend.getSystemGalacticPosition(coordinates));
        });
        this.travelLine.setPoints(points);
    }

    public setCurrentStarSystem(starSystemCoordinates: StarSystemCoordinates, skipAnimation: boolean) {
        this.currentSystemCoordinates = starSystemCoordinates;
        this.selectedSystemCoordinates = starSystemCoordinates;

        this.starMapUI.setCurrentSystem(starSystemCoordinates);
        this.focusOnCurrentSystem(skipAnimation);
    }

    public focusOnCurrentSystem(skipAnimation = false) {
        if (this.currentSystemCoordinates === null) {
            console.warn("No current system seed!");
            return;
        }
        this.focusOnSystem(this.currentSystemCoordinates, skipAnimation);
    }

    public focusOnSystem(starSystemCoordinates: StarSystemCoordinates, skipAnimation = false) {
        const starSystemPosition = wrapVector3(this.universeBackend.getSystemGalacticPosition(starSystemCoordinates));

        const cameraDir = this.controls.thirdPersonCamera.getDirection(
            Vector3.Forward(this.scene.useRightHandedSystem),
        );

        const cameraToStarDir = starSystemPosition.subtract(this.controls.thirdPersonCamera.globalPosition).normalize();

        const rotationAngle = Math.acos(Vector3.Dot(cameraDir, cameraToStarDir));

        const animationDurationSeconds = 1;

        // if the rotation axis has a length different from 1, it means the cross product was made between very close vectors : no rotation is needed
        if (skipAnimation) {
            lookAt(this.controls.getTransform(), starSystemPosition, this.scene.useRightHandedSystem);
            this.controls.getTransform().computeWorldMatrix(true);
        } else if (rotationAngle > 0.02) {
            const rotationAxis = Vector3.Cross(cameraDir, cameraToStarDir).normalize();
            this.rotationAnimation = new TransformRotationAnimation(
                this.controls.getTransform(),
                rotationAxis,
                rotationAngle,
                animationDurationSeconds,
            );
        }

        const transformToStarDir = starSystemPosition
            .subtract(this.controls.getTransform().getAbsolutePosition())
            .normalize();
        const distance = starSystemPosition.subtract(this.controls.getTransform().getAbsolutePosition()).length();
        const targetPosition = this.controls
            .getTransform()
            .getAbsolutePosition()
            .add(transformToStarDir.scaleInPlace(distance));

        // if the transform is already in the right position, do not animate
        if (skipAnimation) this.controls.getTransform().position = targetPosition;
        else if (targetPosition.subtract(this.controls.getTransform().getAbsolutePosition()).lengthSquared() > 0.1) {
            this.translationAnimation = new TransformTranslationAnimation(
                this.controls.getTransform(),
                targetPosition,
                animationDurationSeconds,
            );
        }

        const targetRadius = 10;
        if (skipAnimation) this.controls.thirdPersonCamera.radius = targetRadius;
        else {
            this.radiusAnimation = new CameraRadiusAnimation(
                this.controls.thirdPersonCamera,
                targetRadius,
                animationDurationSeconds,
            );
        }

        this.selectedSystemCoordinates = starSystemCoordinates;
        const starSystemModel = this.universeBackend.getSystemModelFromCoordinates(starSystemCoordinates);
        if (starSystemModel === null)
            throw new Error(
                `Could not find star system model for coordinates ${JSON.stringify(starSystemCoordinates)}`,
            );
        this.starMapUI.setSelectedSystem(starSystemModel, this.currentSystemCoordinates);
        this.starMapUI.setHoveredSystem(null);
    }

    public render() {
        this.scene.render();
    }

    public attachControl() {
        this.scene.attachControl();
        this.starMapUI.htmlRoot.classList.remove("hidden");
        if (this.player.currentItinerary !== null) {
            this.drawPath(this.player.currentItinerary);
        }
    }

    public detachControl() {
        this.scene.detachControl();
        this.starMapUI.htmlRoot.classList.add("hidden");
    }

    public getMainScene(): Scene {
        return this.scene;
    }
}
