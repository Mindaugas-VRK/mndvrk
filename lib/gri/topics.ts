/** Material topics, grouped as in the product wireframes. */
export type TopicCategory = "overarching" | "environment" | "people" | "health-safety" | "transparency";

export const TOPIC_CATEGORIES: Record<TopicCategory, { title: string; description: string }> = {
  overarching: { title: "Overarching", description: "Cross-cutting governance and resilience topics that frame the whole ESG programme." },
  environment: { title: "Environment", description: "The organisation's impacts on climate, water, nature and land." },
  people: { title: "People", description: "How the organisation respects and develops the people in and around it." },
  "health-safety": { title: "Health and safety", description: "Keeping employees and contractors safe at work." },
  transparency: { title: "Transparency", description: "Responsible tax practices and fighting corruption." },
};

export type Topic = { key: string; category: TopicCategory; title: string; kpis: string[]; summary: string };

export const TOPICS: Topic[] = [
  { key: "governance", category: "overarching", title: "Governance", kpis: ["compliance"], summary: "ESG oversight, roles and accountability, board and committee structure." },
  { key: "catastrophic-hazards", category: "overarching", title: "Catastrophic hazard management", kpis: ["health-safety"], summary: "Preventing and responding to major accidents and emergencies." },
  { key: "responsible-sourcing", category: "overarching", title: "Responsible sourcing", kpis: ["materials"], summary: "Supplier standards, due diligence and sustainable materials." },
  { key: "climate-change", category: "environment", title: "Climate change", kpis: ["energy", "emissions"], summary: "Energy use, greenhouse gas emissions and transition plans." },
  { key: "water", category: "environment", title: "Water", kpis: ["water"], summary: "Water withdrawal, discharge and consumption, especially in water-stressed areas." },
  { key: "biodiversity", category: "environment", title: "Biodiversity", kpis: [], summary: "Impacts on ecosystems and protected areas." },
  { key: "land-stewardship", category: "environment", title: "Land stewardship", kpis: ["waste"], summary: "Land use, contamination, waste and restoration." },
  { key: "human-rights", category: "people", title: "Human rights", kpis: ["workforce"], summary: "Labour rights, collective bargaining and human rights due diligence." },
  { key: "dei", category: "people", title: "Diversity, equity and inclusion", kpis: ["workforce"], summary: "Gender balance, pay equity and inclusion." },
  { key: "workplace-safety", category: "health-safety", title: "Workplace safety", kpis: ["health-safety"], summary: "Injury prevention, safety culture and reporting." },
  { key: "tax", category: "transparency", title: "Tax", kpis: [], summary: "Tax strategy, governance and country-by-country transparency." },
  { key: "anti-corruption", category: "transparency", title: "Anti corruption", kpis: ["compliance"], summary: "Anti-bribery policies, training and compliance." },
];

export const TOPIC_BY_KEY = new Map(TOPICS.map((t) => [t.key, t]));
