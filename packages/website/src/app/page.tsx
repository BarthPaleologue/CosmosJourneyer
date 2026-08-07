import type { ReactElement } from "react";

import { SiteNavigation } from "@/components/SiteNavigation";

import { ViewCommunity } from "./ViewCommunity";
import { ViewFeatures } from "./ViewFeatures";
import { ViewHero } from "./ViewHero";
import { ViewRoadmap } from "./ViewRoadmap";

export default function Home(): ReactElement {
    return (
        <>
            <SiteNavigation />
            <main>
                <ViewHero />
                <ViewFeatures />
                <ViewRoadmap />
                <ViewCommunity />
            </main>
        </>
    );
}
