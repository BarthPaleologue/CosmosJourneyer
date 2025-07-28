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

import i18n from "@/i18n";

export class CreditsPanel {
    readonly htmlRoot: HTMLElement;

    constructor() {
        this.htmlRoot = this.createPanelHTML();
    }

    private createPanelHTML(): HTMLElement {
        const panel = document.createElement("div");
        panel.className = "sidePanel";

        // Create title
        const title = document.createElement("h2");
        title.textContent = i18n.t("sidePanel:credits");
        panel.appendChild(title);

        // Contributors section
        const contributorsHeader = document.createElement("h3");
        contributorsHeader.textContent = i18n.t("sidePanel:contributors");
        panel.appendChild(contributorsHeader);

        const contributorsDiv = document.createElement("div");
        contributorsDiv.className = "contributors-section";

        const contributorsImg = document.createElement("img");
        contributorsImg.src = "https://contrib.rocks/image?repo=BarthPaleologue/CosmosJourneyer";
        contributorsImg.alt = "Contributors";
        contributorsImg.className = "contributors-image";
        contributorsDiv.appendChild(contributorsImg);
        panel.appendChild(contributorsDiv);

        // Programming section
        const programmingHeader = document.createElement("h3");
        programmingHeader.textContent = i18n.t("sidePanel:programming");
        panel.appendChild(programmingHeader);

        const programmingCredits = [
            'Created by <a target="_blank" href="https://barth.paleologue.fr">Barthélemy Paléologue</a>',
            'Webpack configuration & Refactorings by <a target="_blank" href="https://github.com/happy44300">Martin Molli</a>',
            'Built with <a target="_blank" href="https://www.babylonjs.com/">BabylonJS</a> and its awesome forum',
            'Planet surface rendering based on <a target="_blank" href="https://www.youtube.com/watch?v=hHGshzIXFWY&list=PLRL3Z3lpLmH3PNGZuDNf2WXnLTHpN9hXy">SimonDev\'s 3D World Generation video series</a>',
            'Star colors made using <a target="_blank" href="https://www.fourmilab.ch/documents/specrend/">John Walker\'s "Colour Rendering of Spectra"</a>',
            'Black hole shader based on <a target="_blank" href="https://www.shadertoy.com/view/tsBXW3">set111 implementation on shadertoy</a>',
            'Lens flare shader based on <a target="_blank" href="https://www.shadertoy.com/view/wlcyzj">TheNosiriN implementation on shadertoy</a>',
            'Fractal raymarching based on <a target="_blank" href="https://www.shadertoy.com/view/tsc3Rj">Nazlbit\'s implementation</a> and <a target="_blank" href="https://www.shadertoy.com/view/wdjGWR">Myro\'s implementation</a> on shadertoy',
            'Mandelbox raymarching based on <a target="_blank" href="https://www.shadertoy.com/view/llGXDR">geoff\'s implementation</a> on shadertoy',
            'Sierpinski raymarching based on <a target="_blank" href="https://www.shadertoy.com/view/4dl3Wl">Inigo Quilez\'s implementation</a> on shadertoy',
            'Menger Sponge raymarching based on <a target="_blank" href="https://www.shadertoy.com/view/XttfRN">reinder\'s implementation</a> on shadertoy',
        ];

        programmingCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        const modelHeader = document.createElement("h3");
        modelHeader.textContent = i18n.t("sidePanel:models");
        panel.appendChild(modelHeader);

        const modelCredits = [
            'ISS Model from <a target="_blank" href="https://solarsystem.nasa.gov/gltf_embed/2378/">NASA\'s Solar System Exploration</a>',
        ];

        modelCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        // Materials & Textures section
        const materialsHeader = document.createElement("h3");
        materialsHeader.textContent = i18n.t("sidePanel:materials");
        panel.appendChild(materialsHeader);

        const materialsCredits = [
            'Awesome PBR materials from <a target="_blank" href="https://freepbr.com">freepbr.com</a>',
            'Solar panel material from <a target="_blank" href="https://ambientCG.com">ambientCG.com</a>, licensed under the Creative Commons CC0 1.0 Universal License.',
            'Jupiter texture from <a target="_blank" href="https://www.solarsystemscope.com/textures/">Solar System Scope</a>, licensed under Attribution 4.0 International license',
            'Saturn texture from <a target="_blank" href="https://www.solarsystemscope.com/textures/">Solar System Scope</a>, licensed under Attribution 4.0 International license',
            'Uranus texture from <a target="_blank" href="https://www.solarsystemscope.com/textures/">Solar System Scope</a>, licensed under Attribution 4.0 International license',
            'Neptune texture from <a target="_blank" href="https://www.solarsystemscope.com/textures/">Solar System Scope</a>, licensed under Attribution 4.0 International license',
            'Saturn rings from <a target="_blank" href="https://www.solarsystemscope.com/textures/">Solar System Scope</a>, licensed under Attribution 4.0 International license',
            'Uranus rings from <a target="_blank" href="https://planetpixelemporium.com/uranus.html">Planet Pixel Emporium</a>, licensed under the terms specified <a target="_blank" href="https://planetpixelemporium.com/planets.html">here</a>',
            'Mars height map from Mola team, published by the <a target="_blank" href="https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m">USGS Astrogeology Science Center</a>, under the CC0 license',
            'Mars color map from <a target="_blank" href="https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m">USGS Astrogeology Science Center</a>',
            'Moon color and height map from <a target="_blank" href="https://svs.gsfc.nasa.gov/4720">NASA\'s Scientific Visualization Studio</a>',
            'Earth height map from <a target="_blank" href="https://commons.wikimedia.org/wiki/File:World_elevation_map.png">Wikipedia Commons</a>, licensed under the Creative Commons <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">Attribution-Share Alike 4.0 International</a> license',
            'Mercury height map from <a target="_blank" href="https://web.archive.org/web/20210330125010/https://astrogeology.usgs.gov/search/map/Mercury/Topography/MESSENGER/Mercury_Messenger_USGS_DEM_Global_665m_v2">USGS Astrogeology Science Center</a>',
            'Mercury color map from the <a target="_blank" href="https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_basemap_md3_color_global_mosaic_665m">Applied Coherent Technology Corporation</a> published by USGS Astrogeology Science Center',
        ];

        materialsCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        // Icons section
        const iconsHeader = document.createElement("h3");
        iconsHeader.textContent = i18n.t("sidePanel:icons");
        panel.appendChild(iconsHeader);

        const iconCredits = [
            'Gasoline icon created by <a target="_blank" href="https://www.flaticon.com/free-icons/gasoline" title="gasoline icons">Freepik - Flaticon</a>',
            'Astronomy icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/astronomay" title="astronomy icons">3ab2ou - Flaticon</a>',
            'Space-station icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/space-station" title="space-station icons">Freepik - Flaticon</a>',
            'Space-exploration icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/space-exploration" title="space-exploration icons">Dewi Sari - Flaticon</a>',
            'Expand icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/expand" title="expand icons">Google - Flaticon</a>',
            'Play icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/play" title="play icons">Freepik - Flaticon</a>',
            'Download icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/download" title="download icons">Debi Alpa Nugraha - Flaticon</a>',
            'Delete icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/delete" title="delete icons">bqlqn - Flaticon</a>',
            'Edit icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/edit" title="edit icons">Kiranshastry - Flaticon</a>',
            'Information icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/information" title="information icons">Freepik - Flaticon</a>',
            'Link icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/link" title="link icons">Creaticca Creative Agency - Flaticon</a>',
            'Exploration icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/exploration" title="exploration icons">SprSprK - Flaticon</a>',
            'Launch icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/launch" title="launch icons">Freepik - Flaticon</a>',
            'Barter icons created by <a target="_blank" href="https://www.flaticon.com/free-icons/barter" title="barter icons">Ahmad Roaayala - Flaticon</a>',
        ];

        iconCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        // Font section
        const fontHeader = document.createElement("h3");
        fontHeader.textContent = i18n.t("sidePanel:font");
        panel.appendChild(fontHeader);

        const fontCredit = document.createElement("p");
        fontCredit.innerHTML =
            '<a target="_blank" href="https://typodermicfonts.com/nasalization/">Nasalization font</a> by Typodermic Fonts';
        panel.appendChild(fontCredit);

        // Music section
        const musicHeader = document.createElement("h3");
        musicHeader.textContent = i18n.t("sidePanel:music");
        panel.appendChild(musicHeader);

        const musicCredits = [
            '<a target="_blank" href="https://freesound.org/people/Andrewkn/sounds/455855/">Wandering</a> by Andrewkn',
            '"Deep Relaxation" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Atlantean Twilight" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"That Zen Moment" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Echoes of Time v2" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Infinite Perspective" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Peace of Mind" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Spacial Winds" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Mesmerize" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Reawakening" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Equatorial Complex" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
            '"Soaring" <a target="_blank" href="https://incompetech.com">Kevin MacLeod (incompetech.com)</a> Licensed under Creative Commons: By <a target="_blank" href="http://creativecommons.org/licenses/by/4.0/">Attribution 4.0 License</a>',
        ];

        musicCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        // Sound effects section
        const soundEffectsHeader = document.createElement("h3");
        soundEffectsHeader.textContent = i18n.t("sidePanel:soundEffects");
        panel.appendChild(soundEffectsHeader);

        const soundEffectsCredits = [
            '<a target="_blank" href="https://freesound.org/people/DrMinky/sounds/166186/">Menu screen mouse over</a> by <a target="_blank" href="https://freesound.org/people/DrMinky/">DrMinky</a> | License: <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/">Attribution 4.0</a>',
            '<a target="_blank" href="https://freesound.org/people/lollosound/sounds/386992/">17 DISTORZIONE.WAV</a> by <a target="_blank" href="https://freesound.org/people/lollosound/">lollosound</a> | License: <a target="_blank" href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons 0</a>',
            '<a target="_blank" href="https://freesound.org/people/NHumphrey/sounds/204418/">Large Engine.wav</a> by <a target="_blank" href="https://freesound.org/people/NHumphrey/">NHumphrey</a> | License: <a target="_blank" href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons 0</a>',
            '<a target="_blank" href="https://freesound.org/people/MATRIXXX_/sounds/702805/">Futuristic Inspect Sound, UI, or In-Game Notification.wav</a> by <a target="_blank" href="https://freesound.org/people/MATRIXXX_/">MATRIXXX_</a> | License: <a target="_blank" href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons 0</a>',
            '<a target="_blank" href="https://freesound.org/people/Timbre/sounds/539503/">endless acceleration.flac</a> by <a target="_blank" href="https://freesound.org/people/Timbre/">Timbre</a> | License: <a target="_blank" href="https://creativecommons.org/licenses/by-nc/4.0/">Attribution NonCommercial 4.0</a>',
            '<a target="_blank" href="https://freesound.org/people/LimitSnap_Creations/sounds/318688/">Rocket Thrust effect.wav</a> by <a target="_blank" href="https://freesound.org/people/LimitSnap_Creations/">LimitSnap_Creations</a> | License: <a target="_blank" href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons 0</a>',
            '<a target="_blank" href="https://freesound.org/people/original_sound/sounds/372197/">Error Bleep 4</a> by <a target="_blank" href="https://freesound.org/people/original_sound/">original_sound</a> | License: <a target="_blank" href="http://creativecommons.org/licenses/by/3.0/">Attribution 3.0</a>',
            '<a target="_blank" href="https://freesound.org/people/copyc4t/sounds/554089/">Echoed Blip</a> by <a target="_blank" href="https://freesound.org/people/copyc4t/">copyc4t</a> | License: <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/">Attribution 4.0</a>',
            '<a target="_blank" href="https://youtu.be/cKkDMiGUbUw?si=dHDqjFx57tgOfNeL">The Blue Danube Waltz</a> from Johann Strauss',
            'Spaceship voice generated using <a target="_blank" href="https://elevenlabs.io">ElevenLabs</a>',
        ];

        soundEffectsCredits.forEach((credit) => {
            const p = document.createElement("p");
            p.innerHTML = credit;
            panel.appendChild(p);
        });

        return panel;
    }
}
