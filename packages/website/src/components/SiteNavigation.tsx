import { siteConfig } from "@/siteConfig";

export const SiteNavigation = () => (
    <nav className="siteNav" aria-label="Main navigation">
        <a className="siteMark" href="#top" aria-label="Cosmos Journeyer home">
            <span>CJ</span>
        </a>

        <div className="navLinks">
            <a href="#discover">Discover</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#community">Community</a>
        </div>

        <a className="navPlay" href={siteConfig.gameUrl} target="_blank" rel="noopener noreferrer">
            Play now <span aria-hidden="true">↗</span>
        </a>
    </nav>
);
