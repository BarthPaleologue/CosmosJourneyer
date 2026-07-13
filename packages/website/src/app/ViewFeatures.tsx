import Image from "next/image";

const features = [
    {
        title: "Land and explore",
        description: "Fly from space to a planet's surface, then explore on foot or by rover.",
        image: "/static/showcase/landing.webp",
        alt: "An astronaut observing a luminous anomaly from the surface of a moon",
        layout: "wide",
    },
    {
        title: "Navigate the galaxy",
        description: "Use the 3D star map to inspect nearby systems and plan your route.",
        image: "/static/showcase/navigation.webp",
        alt: "The three-dimensional star map of Cosmos Journeyer",
        layout: "standard",
    },
    {
        title: "Discover celestial objects",
        description: "Visit planets, moons, stars, black holes, anomalies and space stations.",
        image: "/static/showcase/black-hole.webp",
        alt: "A black hole surrounded by a bright accretion disk",
        layout: "standard",
    },
] as const;

export const ViewFeatures = () => (
    <section className="contentSection featureSection" id="discover">
        <div className="featureGrid">
            {features.map((feature, index) => (
                <article
                    className={`featureCard${feature.layout === "wide" ? " featureCardWide" : ""}`}
                    key={feature.title}
                >
                    <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 800px) 100vw, 50vw" />
                    <div className="featureShade" aria-hidden="true" />
                    <div className="featureCopy">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    </section>
);
