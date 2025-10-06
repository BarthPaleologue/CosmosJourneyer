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

import type { ISoundPlayer } from "../audio/soundPlayer";
import { Notification, type NotificationIntent, type NotificationOrigin } from "./notification";

export interface INotificationManager {
    update(deltaSeconds: number): void;
    create(type: NotificationOrigin, intent: NotificationIntent, text: string, durationMillis: number): void;
    setVisible(visible: boolean): void;
}

export class NotificationManager implements INotificationManager {
    private readonly container: HTMLDivElement;
    private activeNotifications: Notification[] = [];
    private isVisible = true;
    private readonly soundPlayer: ISoundPlayer;
    private readonly document: Document;

    constructor(soundPlayer: ISoundPlayer, documentRef: Document = document) {
        this.soundPlayer = soundPlayer;
        this.document = documentRef;

        const createdContainer = this.document.createElement("div");
        createdContainer.classList.add("notification-container");
        this.document.body.appendChild(createdContainer);
        this.container = createdContainer;
    }

    update(deltaSeconds: number): void {
        this.activeNotifications.forEach((notification) => {
            notification.update(deltaSeconds);
            if (notification.getProgress() === 1 && !notification.hasRemovalStarted()) {
                notification.startRemoval();
            }
            if (notification.getRemovalProgress() === 1) {
                notification.dispose();
            }
        });

        this.activeNotifications = this.activeNotifications.filter(
            (notification) => notification.getRemovalProgress() < 1,
        );
    }

    create(type: NotificationOrigin, intent: NotificationIntent, text: string, durationMillis: number): void {
        const notification = new Notification(
            type,
            intent,
            text,
            durationMillis / 1000,
            this.soundPlayer,
            this.container,
            this.document,
        );
        this.activeNotifications.push(notification);
    }

    setVisible(visible: boolean): void {
        if (this.isVisible === visible) return;

        this.isVisible = visible;
        if (visible) {
            this.container.style.removeProperty("display");
        } else {
            this.container.style.display = "none";
        }
    }
}

export class NotificationManagerMock implements INotificationManager {
    update(): void {}
    create(): void {}
    setVisible(): void {}
}
