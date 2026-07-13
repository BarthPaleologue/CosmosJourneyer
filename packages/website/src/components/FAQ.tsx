import type { ReactNode } from "react";

export interface FAQItem {
    readonly id: string;
    readonly question: string;
    readonly answer: ReactNode;
}

interface FAQProps {
    items: readonly FAQItem[];
}

export const FAQ = ({ items }: FAQProps) => (
    <div className="faq" aria-label="Frequently asked questions">
        {items.map((item) => (
            <article className="faqItem" key={item.id}>
                <h3>{item.question}</h3>
                <div className="faqAnswer">{item.answer}</div>
            </article>
        ))}
    </div>
);
