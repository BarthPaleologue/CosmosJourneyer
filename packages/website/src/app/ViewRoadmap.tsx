import Image from "next/image";

type MilestoneStatus = "In development" | "Planned";

interface Milestone {
    readonly status: MilestoneStatus;
    readonly title: string;
    readonly description: string;
    readonly image: string;
    readonly alt: string;
}

const milestones = [
    {
        status: "In development",
        title: "Visual overhaul",
        description: "Improve and optimize the game's visuals. Add SSR and SSAO.",
        image: "/static/showcase/station.webp",
        alt: "A rotating space station illuminated by a nearby star",
    },
    {
        status: "Planned",
        title: "Universal input system",
        description: "Rework the input system to support gamepads and fully rebindable controls.",
        image: "/static/showcase/input-system.webp",
        alt: "A spacecraft flying above an icy planet in front of a star",
    },
    {
        status: "Planned",
        title: "Handcrafted stories",
        description: "Meet memorable characters and travel with them across the cosmos.",
        image: "/static/showcase/stories.webp",
        alt: "A rover traveling across the surface of a moon",
    },
] as const satisfies readonly Milestone[];

export const ViewRoadmap = () => (
    <section className="contentSection roadmapSection" id="roadmap">
        <div className="roadmapHeading">
            <div>
                <h2>
                    What comes
                    <br />
                    next.
                </h2>
            </div>
        </div>

        <div className="milestoneGrid">
            {milestones.map((milestone, index) => (
                <article className="milestone" key={milestone.title}>
                    <div className="milestoneImage">
                        <Image src={milestone.image} alt={milestone.alt} fill sizes="(max-width: 800px) 100vw, 33vw" />
                        <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="milestoneStatus">{milestone.status}</p>
                    <h3>{milestone.title}</h3>
                    <p>{milestone.description}</p>
                </article>
            ))}
        </div>
    </section>
);
