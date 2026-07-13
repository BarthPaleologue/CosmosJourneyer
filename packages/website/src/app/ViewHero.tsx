//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

import { siteConfig } from "@/siteConfig";

export const ViewHero = () => {
    return (
        <section className="hero" id="top">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="heroVideo"
                src="/static/background_video.mp4"
                poster="/static/header4.webp"
                aria-hidden="true"
            />
            <div className="heroVeil" aria-hidden="true" />
            <div className="heroContent">
                <h1>
                    Cosmos
                    <br />
                    Journeyer
                </h1>
                <p className="heroLead">
                    An entire universe in your browser. Seamlessly explore star systems in your spaceship, by rover, or
                    on foot.
                </p>
                <div className="heroActions">
                    <a className="primaryButton" href={siteConfig.gameUrl} target="_blank" rel="noopener noreferrer">
                        Play in browser <span aria-hidden="true">→</span>
                    </a>
                    <a className="textLink" href="#discover">
                        Explore the game <span>↓</span>
                    </a>
                </div>
            </div>

            <div className="heroFootnote" aria-label="Game highlights">
                <p>
                    <strong>100%</strong>
                    <span>
                        Free and
                        <br />
                        open source
                    </span>
                </p>
                <p>
                    <strong>0</strong>
                    <span>
                        Loading screens
                        <br />
                        between worlds
                    </span>
                </p>
                <p>
                    <strong>∞</strong>
                    <span>
                        Procedural
                        <br />
                        worlds
                    </span>
                </p>
            </div>
        </section>
    );
};
