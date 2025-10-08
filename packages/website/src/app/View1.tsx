//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

"use client";

import { handleExternalLink, handleKeyPress } from "@/utils";
import { SiteConfig, SocialLinks as socialLinks } from "@/utils/constants";

import { ScrollArrow } from "@/components/ScrollArrow";
import { SocialLinks as SocialLinksComponent } from "@/components/SocialLinks";
import type { ViewProps } from "@/types";

export const View1 = ({ className = "", id = "view1" }: ViewProps) => {
    const handleStartJourney = () => {
        handleExternalLink(SiteConfig.gameUrl);
    };

    return (
        <section className={`fullView ${className}`} id={id}>
            <video
                autoPlay
                loop
                muted
                playsInline
                className="background-video"
                src="/static/background_video.mp4"
                aria-hidden="true"
            />
            <div className="headerBackground">
                <header>
                    <h1>{SiteConfig.name}</h1>
                    <h2>An entire universe on a web page</h2>
                </header>

                <div id="buttonGrid">
                    <button
                        type="button"
                        id="mainButton"
                        onClick={handleStartJourney}
                        onKeyDown={(e) => {
                            handleKeyPress(handleStartJourney, e);
                        }}
                    >
                        Start your journey!
                    </button>

                    <SocialLinksComponent links={socialLinks} />
                </div>

                <ScrollArrow direction="down" targetSection={1} ariaLabel="Scroll to roadmap section" />
            </div>
        </section>
    );
};
