import { FAQ, type FAQItem } from "@/components/FAQ";
import { siteConfig } from "@/siteConfig";

const featuredCommunityLinks = [
    {
        label: "Reddit",
        description: "Screenshots and discussion",
        url: siteConfig.community.reddit,
    },
    {
        label: "Bluesky",
        description: "Development updates",
        url: siteConfig.community.bluesky,
    },
    {
        label: "Trailer",
        description: "Gameplay video",
        url: siteConfig.community.trailer,
    },
    {
        label: "Patreon",
        description: "Fund development",
        url: siteConfig.community.patreon,
    },
] as const;

const faqItems = [
    {
        id: "what-is-cosmos-journeyer",
        question: "What is Cosmos Journeyer?",
        answer: (
            <p>
                Cosmos Journeyer is a free, open-source space exploration game. It runs in the browser and is also
                available as a desktop application.
            </p>
        ),
    },
    {
        id: "how-to-contribute",
        question: "How can I contribute?",
        answer: (
            <>
                <p>
                    Report bugs, suggest features or contribute code on{" "}
                    <a href={siteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
                    .
                </p>
                <p>
                    Share screenshots and feedback on{" "}
                    <a href={siteConfig.community.reddit} target="_blank" rel="noopener noreferrer">
                        Reddit
                    </a>
                    .
                </p>
                <p>
                    Fund development through{" "}
                    <a href={siteConfig.community.patreon} target="_blank" rel="noopener noreferrer">
                        Patreon
                    </a>{" "}
                    or{" "}
                    <a href={siteConfig.community.githubSponsors} target="_blank" rel="noopener noreferrer">
                        GitHub Sponsors
                    </a>
                    .
                </p>
            </>
        ),
    },
    {
        id: "get-in-touch",
        question: "How can I get in touch?",
        answer: (
            <p>
                Post on{" "}
                <a href={siteConfig.community.reddit} target="_blank" rel="noopener noreferrer">
                    Reddit
                </a>{" "}
                or send an <a href={siteConfig.emailUrl}>email</a>.
            </p>
        ),
    },
] as const satisfies readonly FAQItem[];

export const ViewCommunity = () => (
    <section className="communitySection" id="community">
        <div className="communityBackdrop" aria-hidden="true" />
        <div className="communityLayout">
            <div className="communityContent">
                <h2>
                    Free and
                    <br />
                    open source.
                </h2>
                <p className="communityLead">
                    Cosmos Journeyer is licensed under the AGPL. Its source code, issue tracker and development history
                    are public on GitHub.
                </p>
                <div className="communityActions">
                    <a
                        className="primaryButton"
                        href={siteConfig.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Contribute on GitHub <span aria-hidden="true">↗</span>
                    </a>
                </div>

                <div className="featuredCommunityLinks">
                    {featuredCommunityLinks.map((link) => (
                        <a href={link.url} key={link.label} target="_blank" rel="noopener noreferrer">
                            <span>{link.label}</span>
                            <small>{link.description}</small>
                            <strong aria-hidden="true">↗</strong>
                        </a>
                    ))}
                </div>
            </div>

            <FAQ items={faqItems} />
        </div>

        <footer>
            © {new Date().getFullYear()} Barthélemy Paléologue ·{" "}
            <a href={siteConfig.licenseUrl} target="_blank" rel="noopener noreferrer">
                AGPL-3.0
            </a>
        </footer>
    </section>
);
