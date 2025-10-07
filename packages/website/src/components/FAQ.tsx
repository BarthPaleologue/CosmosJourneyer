import type { FC } from "react";

import type { FAQItem } from "@/types";

interface FAQProps {
    items: readonly FAQItem[];
}

interface FAQItemProps {
    item: FAQItem;
}

const FAQItemComponent: FC<FAQItemProps> = ({ item }) => {
    const renderAnswer = (answer: string | readonly string[]) => {
        if (typeof answer === "string") {
            return <p dangerouslySetInnerHTML={{ __html: answer }} />;
        }

        return (
            <>
                {answer.map((paragraph, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}
            </>
        );
    };

    return (
        <div className="faq-item">
            <h3>{item.question}</h3>
            {renderAnswer(item.answer)}
        </div>
    );
};

export const FAQ: FC<FAQProps> = ({ items }) => {
    return (
        <div id="about">
            <h2>FAQ:</h2>
            {items.map((item) => (
                <FAQItemComponent key={item.id} item={item} />
            ))}
        </div>
    );
};
