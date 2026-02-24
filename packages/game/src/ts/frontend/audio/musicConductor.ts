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

import type { AbstractSound } from "@babylonjs/core/AudioV2/abstractAudio/abstractSound";
import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { SoundState } from "@babylonjs/core/AudioV2/soundState";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type Musics } from "@/frontend/assets/audio/musics";
import { type StarSystemView } from "@/frontend/starSystemView";

import { assertUnreachable } from "@/utils/types";

export class MusicConductor {
    private currentMusic: AbstractSound | null = null;

    /**
     * The number of seconds to wait before playing a new music.
     */
    private silenceSeconds = 0;

    private volume = 1;
    private readonly fadeSeconds = 3;

    private pauseMusicWhenPaused = false;

    private readonly starSystemView: StarSystemView;

    private readonly musics: Musics;

    constructor(musics: Musics, audioEngine: AudioEngineV2, starSystemView: StarSystemView) {
        this.musics = musics;
        this.starSystemView = starSystemView;

        void audioEngine.unlockAsync().then(() => {
            if (this.currentMusic !== null) {
                const copy = this.currentMusic;
                this.currentMusic = null;
                this.setMusic(copy);
            }
        });
    }

    public setMusicFromSelection(musicSelection: ReadonlyArray<AbstractSound>) {
        if (this.currentMusic !== null && musicSelection.includes(this.currentMusic)) {
            return;
        }

        const selectedMusic = musicSelection[Math.floor(Math.random() * musicSelection.length)];
        if (selectedMusic === undefined) {
            return;
        }

        this.setMusic(selectedMusic);
    }

    public setMusic(newMusic: AbstractSound | null) {
        if (this.currentMusic === newMusic) {
            return;
        }

        if (this.currentMusic !== null) {
            this.currentMusic.setVolume(0, { duration: this.fadeSeconds });
            this.currentMusic = null;

            // some silence between two musics
            this.silenceSeconds = this.fadeSeconds;
            return;
        }

        if (newMusic === null) {
            return;
        }

        this.currentMusic = newMusic;
        this.currentMusic.stop();
        this.currentMusic.setVolume(0);
        this.currentMusic.play();
        this.currentMusic.setVolume(this.volume, { duration: this.fadeSeconds });
        console.log("currently playing", this.currentMusic.name);
    }

    public setSoundtrackVolume(volume: number) {
        this.volume = volume;
        if (this.currentMusic !== null) {
            this.currentMusic.setVolume(volume);
        }
    }
    public getVolume(): number {
        return this.volume;
    }

    public update(isPaused: boolean, isInStarSystemView: boolean, isInMainMenu: boolean, deltaSeconds: number) {
        if (this.currentMusic !== null) {
            if (isPaused && this.pauseMusicWhenPaused && this.currentMusic.state === SoundState.Started) {
                this.currentMusic.pause();
                return;
            } else if (!isPaused && this.currentMusic.state === SoundState.Paused) {
                this.currentMusic.play();
                return;
            }

            // if the music has finished playing, set it to null
            if (!isPaused && this.currentMusic.state === SoundState.Stopped) {
                this.currentMusic = null;
                this.silenceSeconds = 30 + (Math.random() - 0.5) * 20;
            }
        }

        if (this.silenceSeconds > 0) {
            this.silenceSeconds -= deltaSeconds;
            return;
        }

        if (this.starSystemView.isLoadingSystem()) {
            return;
        }

        const shipControls = this.starSystemView.getSpaceshipControls();
        const spaceship = shipControls.getSpaceship();
        const isOnFoot = this.starSystemView.scene.getActiveControls() === this.starSystemView.getCharacterControls();
        const playerPosition = this.starSystemView.scene.getActiveControls().getTransform().getAbsolutePosition();
        const closestOrbitalObject = this.starSystemView.getStarSystem().getNearestOrbitalObject(playerPosition);

        const distanceToClosestObject = Vector3.Distance(
            playerPosition,
            closestOrbitalObject.getTransform().getAbsolutePosition(),
        );

        if (!isInStarSystemView) {
            this.setMusic(this.musics.wandering);
            return;
        }

        if (isInMainMenu) {
            this.setMusic(this.musics.wandering);
            return;
        }

        if (!spaceship.isLanded() && spaceship.getTargetLandingPad() !== null) {
            this.setMusic(this.musics.straussBlueDanube);
            return;
        }

        const warpDrive = spaceship.getInternals().getWarpDrive();

        switch (closestOrbitalObject.model.type) {
            case "blackHole":
                this.setMusicFromSelection([this.musics.soaring]);
                return;

            case "mandelbulb":
            case "juliaSet":
            case "mandelbox":
            case "sierpinskiPyramid":
            case "mengerSponge":
            case "darkKnight":
                if (distanceToClosestObject < closestOrbitalObject.getBoundingRadius() * 100) {
                    this.setMusicFromSelection([this.musics.spacialWinds, this.musics.echoesOfTime]);
                    return;
                }
                break;

            case "star":
            case "neutronStar":
            case "telluricPlanet":
            case "telluricSatellite":
            case "gasPlanet":
            case "custom":
                break;
            case "spaceStation":
            case "spaceElevator":
                if (
                    (warpDrive === null || warpDrive.isDisabled()) &&
                    distanceToClosestObject < closestOrbitalObject.getBoundingRadius() * 10
                ) {
                    this.setMusic(this.musics.equatorialComplex);
                    return;
                }
                break;
            default:
                assertUnreachable(closestOrbitalObject.model);
        }

        if (warpDrive !== null && warpDrive.isEnabled()) {
            const suitableMusics = [
                this.musics.atlanteanTwilight,
                this.musics.infinitePerspective,
                this.musics.mesmerize,
            ];

            this.setMusicFromSelection(suitableMusics);
            return;
        }

        if (!spaceship.isLanded() && (warpDrive === null || warpDrive.isDisabled())) {
            const suitableMusics = [this.musics.thatZenMoment, this.musics.deepRelaxation, this.musics.peaceOfMind];
            this.setMusicFromSelection(suitableMusics);
            return;
        }

        if (isOnFoot || spaceship.isLanded()) {
            const suitableMusics = [
                this.musics.thatZenMoment,
                this.musics.deepRelaxation,
                this.musics.peaceOfMind,
                this.musics.mesmerize,
                this.musics.reawakening,
            ];

            this.setMusicFromSelection(suitableMusics);
            return;
        }

        this.setMusic(null);
    }
}
