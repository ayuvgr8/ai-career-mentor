import type { InsertCareerRole, CareerRoleContent } from "@workspace/db";

function illustrativeContent(
  whyItFits: string,
  dayInLife: CareerRoleContent["dayInLife"],
  metrics: string[],
  stakeholders: string[],
  journey: CareerRoleContent["journey"],
  aiImpact: CareerRoleContent["aiImpact"],
  entryRequirements: CareerRoleContent["entryRequirements"],
): CareerRoleContent {
  return {
    label: "Illustrative first draft",
    whyItFits,
    dayInLife,
    metrics,
    stakeholders,
    journey,
    aiImpact,
    entryRequirements,
  };
}

const illustrativeRole = (
  slug: string,
  familySlug: string,
  familyTitle: string,
  title: string,
  summary: string,
  sortOrder: number,
  content: CareerRoleContent,
): InsertCareerRole => ({
  slug,
  familySlug,
  familyTitle,
  title,
  summary,
  status: "illustrative",
  sortOrder,
  content,
});

export const careerRoleSeeds: InsertCareerRole[] = [
  {
    slug: "front-end-engineer",
    familySlug: "software-engineer",
    familyTitle: "Software Engineer",
    title: "Front-end Engineer",
    summary: "Build the accessible, responsive interfaces people use every day.",
    status: "illustrative",
    sortOrder: 1,
    content: illustrativeContent(
      "This path may suit someone who likes both logic and visible craft: shaping an interface, noticing where it confuses people, then making the interaction work across devices. The job is not only styling. It also includes debugging, code review, accessibility, and coordination with design, product, and backend teams. Use these signals as questions to test against your own interests, not as a promise of fit.",
      [
        { time: "09:00–10:00", activity: "Review the team's priorities, open interface bugs, and release signals; pick a focused task." },
        { time: "10:00–11:00", activity: "Clarify acceptance criteria with product and design, including what should happen in less common states." },
        { time: "11:00–12:00", activity: "Build or refine a screen in the team's component system and connect it to product data." },
        { time: "12:00–13:00", activity: "Check loading, empty, and error states with keyboard navigation and responsive layouts." },
        { time: "13:00–14:00", activity: "Take lunch and step away from the screen." },
        { time: "14:00–15:00", activity: "Pair with design or backend teammates on an interaction, API response, or implementation trade-off." },
        { time: "15:00–16:00", activity: "Reproduce a browser or performance issue, inspect it with developer tools, and test a fix." },
        { time: "16:00–17:00", activity: "Review a teammate's code and revise your own work from review or QA feedback." },
        { time: "17:00–18:00", activity: "Verify the change, note any follow-up risks, and share what is ready for release." },
      ],
      [
        "Core Web Vitals and page responsiveness",
        "Task completion, form errors, and interaction failures",
        "Accessibility defects and user-reported interface problems",
      ],
      [
        "Product designer",
        "Product manager",
        "Backend engineer",
        "Quality assurance",
        "People using the product",
      ],
      [
        { period: "0–1 months", focus: "Build a base in semantic HTML, CSS layout, JavaScript, browser tools, and accessibility checks.", evidence: "Make a responsive page and explain how you checked it with keyboard and mobile layouts." },
        { period: "1–3 months", focus: "Practice components, React, Git, and a small API-backed interaction.", evidence: "Build a small project with loading, empty, and error states." },
        { period: "3–6 months", focus: "Add TypeScript, automated tests, responsive details, and accessible interactions.", evidence: "Share a working project with setup notes, a demo, and at least one test." },
        { period: "6–9 months", focus: "Practice debugging, code review, and turning an ambiguous brief into a scoped change.", evidence: "Show how review or user feedback changed your implementation." },
        { period: "9–12 months", focus: "Contribute to a team or complete a realistic feature, including testing and release follow-through.", evidence: "Explain the problem, trade-offs, verification, and what you would improve next." },
      ],
      {
        changing: "AI tools can speed up first drafts of components, tests, explanations, and code search. Engineers still need to understand the codebase, verify behavior in the real product, and own the result.",
        tasksToWatch: [
          "Generated code can miss accessibility, security, performance, or project-specific patterns.",
          "A plausible-looking interface can still be confusing, inaccessible, or fail on less common devices and assistive technologies.",
        ],
        humanEdge: [
          "Understand the user's task and the surrounding product context.",
          "Debug unexpected behavior, review generated code, and make accessibility trade-offs explicit.",
        ],
      },
      {
        foundation: [
          "A willingness to keep learning by building, testing, and revising small pieces of interface work.",
          "Basic problem-solving habits: reproduce an issue, inspect what happened, and explain what you tried.",
        ],
        helpful: [
          "HTML, CSS, JavaScript, Git, API basics, and one component framework such as React; these can be learned through projects.",
          "Responsive design, accessible interaction, and testing fundamentals. Employers differ in which skills they expect at entry.",
        ],
        proofOfWork: [
          "A small, original interface that works on mobile and desktop, with loading and error states.",
          "A short walkthrough of your decisions, accessibility checks, edge cases, and changes made after feedback.",
        ],
      },
    ),
  },
  illustrativeRole(
    "back-end-engineer",
    "software-engineer",
    "Software Engineer",
    "Back-end Engineer",
    "Design services, data flows, and dependable application behavior.",
    2,
    illustrativeContent(
      "This path may suit someone who likes tracing how information moves through a system and making invisible behavior dependable. The work includes understanding product needs, shaping APIs and data models, handling failures, and operating services after release—not just writing server code. People enter through different routes; small projects that demonstrate careful error handling and clear reasoning can help show readiness.",
      [
        { time: "09:00–10:00", activity: "Review service health, recent incidents, deployment notes, and the team's planned work." },
        { time: "10:00–11:00", activity: "Clarify a feature's data and behavior with product, design, and client-side engineering partners." },
        { time: "11:00–12:00", activity: "Trace an existing request through API, application logic, and persistence to understand its constraints." },
        { time: "12:00–13:00", activity: "Implement a focused change with validation, useful error responses, and appropriate access checks." },
        { time: "13:00–14:00", activity: "Take lunch and step away from operational alerts." },
        { time: "14:00–15:00", activity: "Add or update tests for normal behavior, invalid input, and an important failure case." },
        { time: "15:00–16:00", activity: "Review query plans, logs, or traces with a teammate to investigate latency or reliability." },
        { time: "16:00–17:00", activity: "Review a pull request and respond to feedback about correctness, security, or maintainability." },
        { time: "17:00–18:00", activity: "Verify the change in a safe environment, document operational notes, and share release readiness." },
      ],
      [
        "Service availability, latency, and error rates for important user journeys",
        "Data integrity, failed jobs, and recovery time after problems",
        "API correctness and the frequency of regressions or support issues",
      ],
      [
        "Front-end and mobile engineers",
        "Product manager and product designer",
        "Quality, data, and infrastructure teams",
        "Security and privacy partners",
        "Support or operations teams who see service failures first",
      ],
      [
        { period: "0–1 months", focus: "Learn one programming language, HTTP basics, data structures, and how to use a debugger.", evidence: "Build a small service that validates input and returns understandable success and error responses." },
        { period: "1–3 months", focus: "Practice APIs, relational data, Git, and tests using a small local project.", evidence: "Document an API with examples and tests for invalid input and missing records." },
        { period: "3–6 months", focus: "Explore authentication concepts, transactions, background work, and safe handling of failure.", evidence: "Extend a project with access checks, a database migration, and a recovery path." },
        { period: "6–9 months", focus: "Practice reading logs, investigating a performance issue, and reviewing code with others.", evidence: "Write a short incident or debugging note that separates evidence from guesses." },
        { period: "9–12 months", focus: "Deliver a bounded feature from design discussion through testing, deployment readiness, and follow-up.", evidence: "Walk through the design, trade-offs, failure cases, and verification for a complete feature." },
      ],
      {
        changing: "AI can draft routine handlers, tests, and query explanations, and can help search unfamiliar code. Engineers remain responsible for data access boundaries, failure behavior, and how a service behaves under real conditions.",
        tasksToWatch: [
          "Generated code may omit authorization checks, transaction boundaries, or input validation that the surrounding service requires.",
          "A suggested query or fix can appear correct while increasing load, exposing data, or failing during retries.",
        ],
        humanEdge: [
          "Understand system context and identify which failures matter most to people using the product.",
          "Review security, data integrity, and operational behavior, then communicate risk clearly to partners.",
        ],
      },
      {
        foundation: [
          "Patience for tracing a problem across several steps and a habit of writing down what the evidence shows.",
          "Willingness to ask how a feature should behave when a dependency fails or data is missing.",
        ],
        helpful: [
          "Programming, HTTP and API concepts, SQL, Git, and testing; the exact language and framework vary by team.",
          "Basic security, privacy, and operational concepts. Formal credentials are not a universal entry requirement.",
        ],
        proofOfWork: [
          "A small service with a clear API, data model, automated tests, and documented setup.",
          "A concise explanation of an error or performance issue you investigated and how you verified the fix.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "mobile-engineer",
    "software-engineer",
    "Software Engineer",
    "Mobile Engineer",
    "Build focused experiences for phones and tablets.",
    3,
    illustrativeContent(
      "This path may suit someone who cares about how software feels in a person's hand and enjoys solving technical problems shaped by devices, networks, and operating systems. Mobile engineering includes interface work, local state, accessibility, testing across device conditions, and coordination with backend and design partners. The day varies by team: some build native apps, while others use cross-platform tools.",
      [
        { time: "09:00–10:00", activity: "Check release health, crash reports, device-specific feedback, and the current sprint priorities." },
        { time: "10:00–11:00", activity: "Review a flow with design and product, including small-screen, offline, and permission states." },
        { time: "11:00–12:00", activity: "Implement an interaction using the team's native or cross-platform component patterns." },
        { time: "12:00–13:00", activity: "Test navigation, touch targets, dynamic text, and screen-reader behavior on a device or simulator." },
        { time: "13:00–14:00", activity: "Take lunch away from the development environment." },
        { time: "14:00–15:00", activity: "Pair with a service engineer on API behavior, caching, or a network interruption edge case." },
        { time: "15:00–16:00", activity: "Investigate a crash or rendering issue across operating-system versions and device sizes." },
        { time: "16:00–17:00", activity: "Review code and automated tests, then incorporate design or quality feedback." },
        { time: "17:00–18:00", activity: "Run a release checklist, note remaining device risks, and share what is safe to ship." },
      ],
      [
        "Crash-free sessions and reliability of important app flows",
        "Task completion, responsiveness, and accessibility findings",
        "Store review issues, support reports, and adoption interpreted with user context",
      ],
      [
        "Product designers and product managers",
        "Back-end and platform engineers",
        "Quality engineers and release coordinators",
        "Accessibility specialists",
        "People using a wide range of devices and assistive settings",
      ],
      [
        { period: "0–1 months", focus: "Learn programming fundamentals, interface layout, Git, and how mobile apps are structured.", evidence: "Build a simple multi-screen app that remains usable with larger text and a small viewport." },
        { period: "1–3 months", focus: "Practice a native or cross-platform toolkit, navigation, state, and consuming a basic API.", evidence: "Create an app flow with loading, empty, error, and success states." },
        { period: "3–6 months", focus: "Add tests, local persistence, permissions, and accessibility checks across device sizes.", evidence: "Demonstrate a resilient flow that handles denied permission and lost connectivity." },
        { period: "6–9 months", focus: "Investigate performance and crashes; learn how app signing and release review work.", evidence: "Explain a reproducible device issue, its fix, and the regression check you added." },
        { period: "9–12 months", focus: "Contribute a contained feature with design, service, and quality partners.", evidence: "Show the feature on more than one device configuration and describe the trade-offs." },
      ],
      {
        changing: "AI can help draft UI components, tests, and platform-specific explanations. It cannot reliably substitute for trying an app on real devices, checking assistive technology, or understanding platform conventions and release constraints.",
        tasksToWatch: [
          "Generated UI can overlook touch target size, dynamic type, lifecycle events, and platform-specific navigation expectations.",
          "Suggested fixes may work in a simulator but fail on slower devices, intermittent networks, or older supported operating systems.",
        ],
        humanEdge: [
          "Notice how device context, accessibility settings, and interruptions change a person's experience.",
          "Verify behavior across a representative device range and coordinate a safe release with the team.",
        ],
      },
      {
        foundation: [
          "Interest in both software logic and the details of how people use apps in everyday settings.",
          "Persistence in reproducing a bug whose behavior changes by device, operating system, or network.",
        ],
        helpful: [
          "Programming, UI layout, Git, API basics, and a native or cross-platform toolkit; employers differ on preferred stacks.",
          "Accessibility, app lifecycle, testing, and release fundamentals. A computer science degree is not the only route.",
        ],
        proofOfWork: [
          "A small app that works across multiple screen sizes and includes thoughtful loading and offline states.",
          "A project note showing device testing, accessibility checks, and how user feedback informed a revision.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "quality-engineer",
    "software-engineer",
    "Software Engineer",
    "Quality Engineer",
    "Help teams find important failures before users do.",
    4,
    illustrativeContent(
      "This path may suit someone who is curious about how things fail and wants to help a team deliver changes with confidence. Quality engineering is broader than clicking through checklists: it includes risk analysis, exploratory testing, automation, testability, and helping teams learn from defects. Some roles focus on hands-on investigation; others emphasize tooling, reliability, or coaching developers in quality practices.",
      [
        { time: "09:00–10:00", activity: "Review new changes, open defects, production signals, and the team's highest-risk user journeys." },
        { time: "10:00–11:00", activity: "Ask product and engineering partners what changed and identify assumptions worth challenging." },
        { time: "11:00–12:00", activity: "Explore a feature with realistic data, unusual inputs, and different user permissions." },
        { time: "12:00–13:00", activity: "Write or improve an automated check for a stable, high-value behavior." },
        { time: "13:00–14:00", activity: "Take lunch and step away from test results." },
        { time: "14:00–15:00", activity: "Reproduce a reported issue, collect clear evidence, and assess who or what it affects." },
        { time: "15:00–16:00", activity: "Pair with a developer to improve testability or add coverage around a risky boundary." },
        { time: "16:00–17:00", activity: "Run a focused regression pass and share failures with actionable reproduction steps." },
        { time: "17:00–18:00", activity: "Summarize remaining uncertainty and agree on release checks or follow-up ownership." },
      ],
      [
        "Escaped defects and their impact on important user tasks",
        "Reliability and usefulness of automated checks, including flaky-test trends",
        "Time to reproduce and resolve high-impact issues",
      ],
      [
        "Developers and engineering leads",
        "Product managers and designers",
        "Support and operations teams",
        "Security, accessibility, and compliance partners",
        "People affected by defects and changes",
      ],
      [
        { period: "0–1 months", focus: "Learn how software behaves, how to describe a bug, and how to use browser or device inspection tools.", evidence: "Write a reproducible defect report with clear expected and actual behavior." },
        { period: "1–3 months", focus: "Practice test design, exploratory testing, test data, and basic programming or scripting.", evidence: "Create a risk-based test plan for a small user flow." },
        { period: "3–6 months", focus: "Automate stable checks and learn how continuous integration runs tests.", evidence: "Add a readable automated test and explain what it does not cover." },
        { period: "6–9 months", focus: "Investigate flaky failures, accessibility risks, and how to prioritize defects by impact.", evidence: "Show how you isolated a failure and helped a team prevent its recurrence." },
        { period: "9–12 months", focus: "Support a feature through planning, testing, release, and learning from follow-up signals.", evidence: "Present a quality plan that balances risk, evidence, and delivery constraints." },
      ],
      {
        changing: "AI can suggest test cases, draft automation, and summarize defect reports. Quality engineers still need to judge risk, verify that tests reflect real user needs, and distinguish a meaningful failure from noisy output.",
        tasksToWatch: [
          "Generated tests may repeat implementation assumptions instead of checking the behavior a user depends on.",
          "Automated summaries can hide intermittent failures, missing coverage, or the difference between severity and frequency.",
        ],
        humanEdge: [
          "Ask what could go wrong for different users and decide which risks deserve attention first.",
          "Turn an unclear failure into evidence the team can reproduce, understand, and prevent.",
        ],
      },
      {
        foundation: [
          "Curiosity, attention to detail, and willingness to question assumptions without blaming people.",
          "Clear communication about observed behavior, uncertainty, and the potential impact of a defect.",
        ],
        helpful: [
          "Testing concepts, basic programming or scripting, version control, and one automation tool; the exact stack varies.",
          "Accessibility, API, data, and software-delivery basics. Many skills can be demonstrated in self-directed projects.",
        ],
        proofOfWork: [
          "A small test plan that prioritizes risks and includes useful examples and edge cases.",
          "A sample automated check or defect report with setup, reproduction steps, evidence, and impact.",
        ],
      },
    ),
  ),
  {
    slug: "performance-marketing",
    familySlug: "marketing",
    familyTitle: "Marketing",
    title: "Performance Marketer",
    summary: "Use careful experiments and measurement to improve campaign outcomes.",
    status: "illustrative",
    sortOrder: 5,
    content: illustrativeContent(
      "This path may suit someone who enjoys asking why an audience responded, testing a clear idea, and connecting creative work to a measurable outcome. It is not just launching ads or reading dashboards: tracking can be incomplete, results can be noisy, and good decisions often mean pausing a campaign. The strongest work balances curiosity, clear writing, responsible measurement, and budget discipline.",
      [
        { time: "09:00–10:00", activity: "Check spend against budget guardrails, tracking health, and campaign changes since the last review." },
        { time: "10:00–11:00", activity: "Align with the team on the experiment, target outcome, and any delivery or policy risks." },
        { time: "11:00–12:00", activity: "Compare audience, creative, and landing-page results; check whether the data is complete enough to use." },
        { time: "12:00–13:00", activity: "Write a testable hypothesis and define the metric, comparison, and stopping rule." },
        { time: "13:00–14:00", activity: "Take lunch and step away from the dashboards." },
        { time: "14:00–15:00", activity: "Set up or adjust a campaign; verify links, audience exclusions, budget, and platform rules." },
        { time: "15:00–16:00", activity: "Review creative variations with a designer or writer and keep the test focused on a clear difference." },
        { time: "16:00–17:00", activity: "Compare lead or purchase quality with sales, product, or client partners—not just click volume." },
        { time: "17:00–18:00", activity: "Record what the results can support, what remains uncertain, and the next safe action." },
      ],
      [
        "Cost per acquisition and customer acquisition cost, checked against margin and customer value",
        "Conversion rate, qualified leads or purchases, and where people leave the funnel",
        "Incremental outcomes and return on ad spend only where the measurement supports those claims",
      ],
      [
        "Creative and content partners",
        "Sales or customer-success teams",
        "Product or analytics partners",
        "Clients, founders, or business owners",
        "Finance, legal, and privacy reviewers when needed",
      ],
      [
        { period: "0–1 months", focus: "Learn campaign terms, spreadsheet basics, funnel stages, and how tracking links and events work.", evidence: "Explain what a sample funnel shows and what it cannot prove." },
        { period: "1–3 months", focus: "Practice audience research, ad messaging, campaign setup, and checking tracking before launch.", evidence: "Write a mock campaign brief with an objective, audience, budget limit, and guardrails." },
        { period: "3–6 months", focus: "Analyze or simulate small tests; compare creative and landing-page outcomes without overstating causality.", evidence: "Write a readout that separates observed results from possible explanations." },
        { period: "6–9 months", focus: "Coordinate with creative and sales partners; practice pacing, privacy-safe measurement, and lead-quality checks.", evidence: "Show how downstream feedback changed a campaign recommendation." },
        { period: "9–12 months", focus: "Plan a bounded campaign or experiment, including review points and a responsible stop condition.", evidence: "Present the hypothesis, setup, result, uncertainty, and next action." },
      ],
      {
        changing: "AI can draft copy variants, organize research notes, and summarize dashboards. It cannot repair weak tracking or establish that an observed change was caused by a campaign.",
        tasksToWatch: [
          "Generated claims or audience assumptions may be inaccurate or unsuitable for an ad platform.",
          "Automated optimization can chase easy conversions while missing lead quality or longer-term effects.",
        ],
        humanEdge: [
          "Choose a meaningful business question and a responsible experiment.",
          "Check data quality, protect audience privacy, and explain uncertainty to stakeholders.",
        ],
      },
      {
        foundation: [
          "Comfort asking questions about numbers and clearly explaining what you do and do not know.",
          "Curiosity about how people discover, compare, and choose products or services.",
        ],
        helpful: [
          "Spreadsheet skills, basic analytics, writing, and familiarity with campaign platforms; access to a live ad budget is not required to practice.",
          "Consent, privacy, platform policies, and attribution limits; requirements vary by market and employer.",
        ],
        proofOfWork: [
          "A mock campaign plan with audience, message, measurement, budget guardrails, and a stopping rule.",
          "A concise experiment readout that names data limitations and avoids claiming more than the evidence shows.",
        ],
      },
    ),
  },
  illustrativeRole(
    "brand-marketing",
    "marketing",
    "Marketing",
    "Brand Marketer",
    "Shape consistent positioning, campaigns, and audience understanding.",
    6,
    illustrativeContent(
      "This path may suit someone who enjoys understanding how people perceive an organization and turning that understanding into clear, consistent communication. Brand marketing can include research, positioning, campaign planning, creative reviews, and internal alignment. It is not just choosing colors or writing slogans: the work connects audience insight and business strategy while allowing the brand to evolve responsibly.",
      [
        { time: "09:00–10:00", activity: "Review current campaign feedback, audience signals, and questions raised by customer-facing teams." },
        { time: "10:00–11:00", activity: "Align with marketing and product partners on the audience, message, and business context." },
        { time: "11:00–12:00", activity: "Review research, competitor examples, and existing brand materials for patterns and gaps." },
        { time: "12:00–13:00", activity: "Draft a positioning or campaign brief that connects audience needs to a clear message." },
        { time: "13:00–14:00", activity: "Take lunch and make room for fresh perspective." },
        { time: "14:00–15:00", activity: "Review creative concepts with designers and writers; check tone, clarity, and accessibility." },
        { time: "15:00–16:00", activity: "Discuss channel fit and rollout details with communications, growth, or regional teams." },
        { time: "16:00–17:00", activity: "Check claims and consistency with legal, product, or leadership partners as needed." },
        { time: "17:00–18:00", activity: "Record decisions, open questions, and the signals that will inform the next brand review." },
      ],
      [
        "Awareness and consideration interpreted with the research method and audience in view",
        "Message comprehension, recall, and consistency across important touchpoints",
        "Campaign reach and engagement alongside longer-term audience feedback",
      ],
      [
        "Brand and creative leads",
        "Product marketing and product teams",
        "Communications, growth, and regional marketers",
        "Research and customer-facing teams",
        "Legal and leadership partners for sensitive or high-visibility work",
      ],
      [
        { period: "0–1 months", focus: "Study audience research, positioning, writing fundamentals, and how brands show up across channels.", evidence: "Analyze a brand example and distinguish its audience, promise, proof, and tone." },
        { period: "1–3 months", focus: "Practice research synthesis, message hierarchy, and concise creative briefs.", evidence: "Write a brief that states the audience insight, desired response, and evidence needed." },
        { period: "3–6 months", focus: "Develop campaign concepts with designers and test whether messages are understood as intended.", evidence: "Show several message options and how feedback changed the recommendation." },
        { period: "6–9 months", focus: "Coordinate a small cross-channel launch and learn basic brand measurement limits.", evidence: "Create a rollout plan with channel roles, review points, and qualitative signals." },
        { period: "9–12 months", focus: "Support brand planning from insight through execution and post-campaign learning.", evidence: "Present what the campaign communicated, who it reached, and what remains uncertain." },
      ],
      {
        changing: "AI can help explore message directions, summarize research, and adapt copy for different formats. It cannot establish a distinctive position or reliably judge cultural context, audience trust, and whether a message rings true.",
        tasksToWatch: [
          "Generated language can sound generic, flatten a brand voice, or introduce unsupported claims.",
          "Research summaries may omit minority perspectives or sensitive context that should shape how a campaign is framed.",
        ],
        humanEdge: [
          "Connect audience understanding to a clear, credible promise and a coherent brand experience.",
          "Use judgment about tone, culture, evidence, and the long-term effects of a short-term campaign.",
        ],
      },
      {
        foundation: [
          "Interest in why people trust, recognize, or choose organizations and products.",
          "Clear writing, curiosity about audience perspectives, and comfort discussing creative work constructively.",
        ],
        helpful: [
          "Research literacy, messaging, campaign planning, and familiarity with creative workflows; formal marketing education is not required everywhere.",
          "Basic measurement and accessibility awareness, plus the ability to check claims with subject-matter partners.",
        ],
        proofOfWork: [
          "A positioning or campaign brief grounded in a specific audience insight and credible evidence.",
          "A small set of channel examples that demonstrate consistent voice and explain the choices behind them.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "content-marketing",
    "marketing",
    "Marketing",
    "Content Marketer",
    "Turn audience questions into useful stories and distribution plans.",
    7,
    illustrativeContent(
      "This path may suit someone who likes answering real audience questions through useful writing, visuals, or other media. Content marketing involves research, planning, editing, distribution, and learning which material helps people—not simply publishing as often as possible. Strong work depends on credibility and usefulness, not only traffic volume.",
      [
        { time: "09:00–10:00", activity: "Review the editorial calendar, audience questions, and performance or feedback on recently published work." },
        { time: "10:00–11:00", activity: "Talk with sales, support, or subject experts to find a question people need answered." },
        { time: "11:00–12:00", activity: "Research the topic, check sources, and define the reader's need and the content's purpose." },
        { time: "12:00–13:00", activity: "Draft an outline or script and confirm the claims with a qualified subject-matter reviewer." },
        { time: "13:00–14:00", activity: "Take lunch and step away from the draft." },
        { time: "14:00–15:00", activity: "Edit for accuracy, usefulness, accessibility, and the reader's level of familiarity." },
        { time: "15:00–16:00", activity: "Coordinate design, search, email, or social distribution with channel partners." },
        { time: "16:00–17:00", activity: "Publish or update a piece, checking links, metadata, formatting, and disclosures." },
        { time: "17:00–18:00", activity: "Record what the piece can be evaluated on and plan a useful refresh or follow-up." },
      ],
      [
        "Qualified audience engagement and completion of useful next steps",
        "Search visibility and referral patterns considered alongside content quality",
        "Lead quality, assisted journeys, and audience feedback rather than raw page views alone",
      ],
      [
        "Subject-matter experts and product marketers",
        "Editors, designers, and video or audio producers",
        "Search, email, and social distribution partners",
        "Sales and customer support",
        "Legal or compliance reviewers for regulated topics",
      ],
      [
        { period: "0–1 months", focus: "Practice research, clear writing, source checking, and basic web publishing.", evidence: "Write a useful explainer with links to reliable sources and a clear intended reader." },
        { period: "1–3 months", focus: "Learn editorial planning, interviewing, editing, and the basics of one distribution channel.", evidence: "Create a content brief with an audience question, format, sources, and purpose." },
        { period: "3–6 months", focus: "Publish a small series, gather feedback, and improve one piece based on how readers use it.", evidence: "Show a before-and-after revision and explain the evidence behind it." },
        { period: "6–9 months", focus: "Coordinate with design and channel partners; learn search and measurement limitations.", evidence: "Present a distribution plan that distinguishes reach from useful engagement." },
        { period: "9–12 months", focus: "Own a bounded editorial initiative from research through refresh and outcome review.", evidence: "Share the work, its audience value, what signals you used, and what you would change." },
      ],
      {
        changing: "AI can help brainstorm outlines, summarize source material, and adapt drafts to formats. Content marketers remain accountable for factual accuracy, original insight, rights, audience usefulness, and a clear editorial voice.",
        tasksToWatch: [
          "Generated drafts can invent citations, repeat common material, or blur the line between verified facts and plausible claims.",
          "Automated optimization may favor clicks over trust, comprehension, or the needs of the intended reader.",
        ],
        humanEdge: [
          "Ask better questions, interview people with relevant expertise, and make complex ideas understandable.",
          "Check sources and claims, apply editorial judgment, and build trust over repeated interactions.",
        ],
      },
      {
        foundation: [
          "Enjoyment of explaining ideas clearly and willingness to verify information before sharing it.",
          "Curiosity about what an audience is trying to understand or accomplish.",
        ],
        helpful: [
          "Writing and editing, research, basic publishing tools, and familiarity with a content channel; a specific degree is not a universal requirement.",
          "Search, analytics, accessibility, copyright, and disclosure basics appropriate to the topics you cover.",
        ],
        proofOfWork: [
          "A small portfolio with researched pieces for a clearly identified audience and purpose.",
          "A content brief and revision example that show sourcing, editorial choices, and how feedback improved the result.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "lifecycle-marketing",
    "marketing",
    "Marketing",
    "Lifecycle Marketer",
    "Improve helpful communication across onboarding and retention journeys.",
    8,
    illustrativeContent(
      "This path may suit someone who thinks about the sequence of a customer relationship and wants messages to arrive at useful moments. Lifecycle marketing spans onboarding, education, retention, and re-engagement across email, in-product, and other channels. The work includes segmentation and experimentation, but also consent, frequency, accessibility, and deciding when a person should not receive another message.",
      [
        { time: "09:00–10:00", activity: "Check delivery health, opt-outs, complaints, and the performance of active lifecycle journeys." },
        { time: "10:00–11:00", activity: "Review a journey with product, support, and data partners to understand where people need help." },
        { time: "11:00–12:00", activity: "Map audience eligibility, consent, message timing, and exclusions for a planned communication." },
        { time: "12:00–13:00", activity: "Draft a message and define a meaningful outcome and a guardrail such as unsubscribe rate." },
        { time: "13:00–14:00", activity: "Take lunch and pause campaign monitoring." },
        { time: "14:00–15:00", activity: "Configure a small experiment, verifying audience logic, links, rendering, and suppression rules." },
        { time: "15:00–16:00", activity: "Review journey data with analytics, checking event definitions and possible selection bias." },
        { time: "16:00–17:00", activity: "Test messages with product and customer-facing partners for clarity and timing." },
        { time: "17:00–18:00", activity: "Document results, uncertainty, consent checks, and the next change or pause decision." },
      ],
      [
        "Activation or meaningful feature use among eligible people",
        "Retention and repeat use interpreted with cohort and product context",
        "Deliverability, opt-outs, complaints, and other indicators of message burden",
      ],
      [
        "Product managers and product designers",
        "Data and engineering teams who own events and messaging systems",
        "Customer support and success teams",
        "Brand, content, and channel partners",
        "Privacy, legal, and compliance reviewers",
      ],
      [
        { period: "0–1 months", focus: "Learn customer journeys, basic email concepts, spreadsheet skills, consent, and message accessibility.", evidence: "Map a simple journey and identify where a message could help or create unnecessary noise." },
        { period: "1–3 months", focus: "Practice segmentation, clear copy, event definitions, and campaign quality checks.", evidence: "Write a mock onboarding sequence with eligibility and suppression rules." },
        { period: "3–6 months", focus: "Plan a bounded experiment with a meaningful outcome, comparison, and customer-protection guardrails.", evidence: "Create an experiment brief and a readout that notes data limitations." },
        { period: "6–9 months", focus: "Work with product and data partners on journey logic, deliverability, and lifecycle measurement.", evidence: "Show how customer feedback or an opt-out pattern changed a communication." },
        { period: "9–12 months", focus: "Own a small lifecycle improvement from diagnosis through measured follow-up.", evidence: "Present the customer need, message choices, safeguards, and what the results support." },
      ],
      {
        changing: "AI can propose message variants, summarize journey patterns, and help with routine campaign setup. People still need to decide whether a message is welcome, ensure audience rules are correct, and check that an apparent lift is meaningful and responsible.",
        tasksToWatch: [
          "Generated personalization can use sensitive or incorrect assumptions and make communication feel intrusive.",
          "Automated send optimization can increase message volume or reward short-term clicks while harming trust and retention.",
        ],
        humanEdge: [
          "Understand customer context and choose a helpful moment, channel, and reason to communicate.",
          "Protect consent and attention, test guardrails, and work across data, product, and support teams.",
        ],
      },
      {
        foundation: [
          "Empathy for how repeated messages affect people's attention and trust.",
          "Comfort with structured details, careful review, and explaining what a measurement does not establish.",
        ],
        helpful: [
          "Writing, spreadsheets, basic analytics, customer-journey mapping, and familiarity with a messaging platform.",
          "Consent, privacy, accessibility, and deliverability fundamentals; platform experience can often be learned through practice.",
        ],
        proofOfWork: [
          "A mock lifecycle journey with audience criteria, useful content, timing, and opt-out safeguards.",
          "An experiment plan that includes a customer-protection metric and explains how results would guide a decision.",
        ],
      },
    ),
  ),
  {
    slug: "product-design",
    familySlug: "content-design",
    familyTitle: "Content Creation / Design",
    title: "Product Designer",
    summary: "Make digital services easier to understand and use.",
    status: "illustrative",
    sortOrder: 9,
    content: illustrativeContent(
      "This path may suit someone who notices friction, enjoys understanding people's needs, and wants to turn ambiguous problems into clear interactions. Product design is not only visual polish: much of the work is framing a problem, checking assumptions, discussing trade-offs, and revising a design after implementation or research. A strong portfolio explains decisions and what changed after feedback.",
      [
        { time: "09:00–10:00", activity: "Review support themes, research notes, and product signals related to one user problem." },
        { time: "10:00–11:00", activity: "Agree with product partners on whose problem is in scope and what decision needs evidence." },
        { time: "11:00–12:00", activity: "Map the current journey, identify friction, and sketch more than one possible flow." },
        { time: "12:00–13:00", activity: "Prototype the most useful question to test, accounting for content and accessibility needs." },
        { time: "13:00–14:00", activity: "Take lunch and make room for a screen break." },
        { time: "14:00–15:00", activity: "Review usability feedback or research with a researcher; separate observed behavior from interpretation." },
        { time: "15:00–16:00", activity: "Pair with engineering on responsive behavior, accessibility, content, or implementation constraints." },
        { time: "16:00–17:00", activity: "Share alternatives with partners, explain trade-offs, and record unanswered questions." },
        { time: "17:00–18:00", activity: "Revise the design and note what needs another test before the team commits to a direction." },
      ],
      [
        "Task success and time or effort needed to complete a key flow",
        "Usability issues, support themes, and accessibility findings",
        "Adoption or retention signals interpreted alongside qualitative feedback",
      ],
      [
        "People participating in research",
        "Product manager",
        "Engineers and quality assurance",
        "Content design, research, and accessibility partners",
        "Customer support or operations",
      ],
      [
        { period: "0–1 months", focus: "Practice visual hierarchy, interaction patterns, accessibility basics, and observing a task without leading someone.", evidence: "Describe one interface problem using what you observed, not just your preferred visual fix." },
        { period: "1–3 months", focus: "Practice flows, wireframes, prototypes, and giving and receiving specific critique.", evidence: "Show two alternatives and the user need or constraint behind your choice." },
        { period: "3–6 months", focus: "Run small usability checks and connect observations to a design change or a new question.", evidence: "Present a case study with evidence, iterations, and remaining uncertainty." },
        { period: "6–9 months", focus: "Work through responsive behavior, accessibility, content, and engineering constraints.", evidence: "Show a design refined with implementation feedback, including a compromise you made." },
        { period: "9–12 months", focus: "Take a contained problem from discovery through validation and handoff, with support as needed.", evidence: "Tell a concise story about the problem, choices, outcome, and next learning." },
      ],
      {
        changing: "AI can help explore early concepts, summarize research notes, and draft content or interfaces. These outputs can support exploration, but they are not evidence about what users need or can use.",
        tasksToWatch: [
          "Generated concepts can reproduce familiar patterns that do not fit the task, audience, language, or accessibility needs.",
          "AI summaries can flatten disagreement, remove context, or make unsupported research themes sound certain.",
        ],
        humanEdge: [
          "Notice context, emotion, accessibility needs, and the difference between a quote and an interpretation.",
          "Facilitate decisions across product and engineering without treating a prototype as proof.",
        ],
      },
      {
        foundation: [
          "Curiosity about how different people understand and use digital services, including where they get stuck.",
          "Willingness to explain design choices, listen to critique, and revise work.",
        ],
        helpful: [
          "Prototyping tools, accessibility principles, interview practice, and collaboration with developers; a particular design tool is not universal.",
          "Basic product metrics and research limitations. A portfolio can come from self-directed or community projects, not only paid work.",
        ],
        proofOfWork: [
          "A case study that shows the problem, evidence, alternatives, feedback, and how the design changed.",
          "A prototype with accessibility considerations and a clear note about what still needs validation.",
        ],
      },
    ),
  },
  illustrativeRole(
    "ux-researcher",
    "content-design",
    "Content Creation / Design",
    "UX Researcher",
    "Help teams learn from people through careful, ethical research.",
    10,
    illustrativeContent(
      "This path may suit someone who listens carefully, notices differences in how people experience a service, and wants evidence to inform decisions. UX research can include interviews, usability studies, surveys, field work, and analysis, chosen to fit the question. It is not simply asking people whether they like a design: strong research protects participants, makes limitations visible, and gives teams useful evidence without overstating what a small study proves.",
      [
        { time: "09:00–10:00", activity: "Review study goals, participant logistics, consent materials, and open questions from the team." },
        { time: "10:00–11:00", activity: "Align with product and design on the decision the research should inform." },
        { time: "11:00–12:00", activity: "Refine a discussion guide or usability tasks to reduce leading questions and ambiguity." },
        { time: "12:00–13:00", activity: "Conduct a research session or review a recording with participant privacy in mind." },
        { time: "13:00–14:00", activity: "Take lunch and avoid treating participant stories as data points without context." },
        { time: "14:00–15:00", activity: "Organize observations, note disconfirming evidence, and distinguish quotes from interpretation." },
        { time: "15:00–16:00", activity: "Compare themes with teammates and check where the sample or method limits conclusions." },
        { time: "16:00–17:00", activity: "Share actionable findings and unresolved questions with design, product, and engineering." },
        { time: "17:00–18:00", activity: "Document decisions, retention of research materials, and responsible next steps." },
      ],
      [
        "Task success, points of confusion, and unmet needs observed in context",
        "Coverage of relevant participant perspectives and research questions",
        "Whether evidence informs a decision or changes a product assumption",
      ],
      [
        "Research participants and community partners",
        "Product designers and product managers",
        "Engineers and data analysts",
        "Customer support and operations",
        "Privacy, accessibility, and research-ethics partners",
      ],
      [
        { period: "0–1 months", focus: "Learn research ethics, consent, observation, note-taking, and the difference between questions and assumptions.", evidence: "Write neutral interview questions for a familiar everyday task." },
        { period: "1–3 months", focus: "Practice interviews and usability sessions; compare qualitative and quantitative questions.", evidence: "Run a small, consent-based practice study and reflect on how your prompts shaped responses." },
        { period: "3–6 months", focus: "Develop synthesis skills, sampling awareness, and concise communication of evidence.", evidence: "Present themes alongside examples, alternative explanations, and limitations." },
        { period: "6–9 months", focus: "Work with a team on a study that informs a real design or product decision.", evidence: "Show how the question, method, and recommendation stayed connected." },
        { period: "9–12 months", focus: "Plan and communicate a bounded study with participant care and follow-through.", evidence: "Explain findings, uncertainty, ethical choices, and what the team did next." },
      ],
      {
        changing: "AI can help organize notes, draft study materials, and find possible patterns across text. Researchers remain responsible for consent, secure handling, context, and the interpretation of what participants meant.",
        tasksToWatch: [
          "Automated summaries can erase contradictions, overstate patterns in a small sample, or detach statements from their context.",
          "Transcription or analysis tools can expose sensitive participant information if data handling is not carefully reviewed.",
        ],
        humanEdge: [
          "Build trust, listen to what people mean, and notice context that a transcript or metric cannot capture.",
          "Choose an appropriate method and communicate uncertainty without making evidence sound more conclusive than it is.",
        ],
      },
      {
        foundation: [
          "Careful listening, curiosity, and respect for people whose experiences differ from your own.",
          "Willingness to question your interpretation and protect participant dignity and privacy.",
        ],
        helpful: [
          "Interviewing, usability testing, note synthesis, accessibility, and basic research ethics.",
          "Knowledge of research methods and data limitations; paths into research vary across employers and regions.",
        ],
        proofOfWork: [
          "A short study plan with a clear question, neutral prompts, participant protections, and a suitable method.",
          "A research summary that separates observation, interpretation, limitations, and possible next steps.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "visual-designer",
    "content-design",
    "Content Creation / Design",
    "Visual Designer",
    "Build a consistent visual language across digital experiences.",
    11,
    illustrativeContent(
      "This path may suit someone who enjoys using visual choices to make information clear, distinctive, and appropriate to its context. Visual designers create and refine layouts, imagery, typography, and systems across digital or campaign work. The role involves briefs, critique, accessibility, production constraints, and collaboration—not just making a polished image in isolation.",
      [
        { time: "09:00–10:00", activity: "Review the creative brief, campaign needs, current assets, and feedback from recent work." },
        { time: "10:00–11:00", activity: "Clarify audience, format, and communication priorities with a writer or marketing partner." },
        { time: "11:00–12:00", activity: "Explore composition, type, color, and visual references for more than one direction." },
        { time: "12:00–13:00", activity: "Build a first layout in the appropriate design tool and check hierarchy at real display sizes." },
        { time: "13:00–14:00", activity: "Take lunch and return with fresh eyes." },
        { time: "14:00–15:00", activity: "Review the work with creative partners; assess contrast, legibility, and brand fit." },
        { time: "15:00–16:00", activity: "Prepare responsive or channel-specific versions while keeping the core message intact." },
        { time: "16:00–17:00", activity: "Refine assets, check licensing and export requirements, and organize handoff files." },
        { time: "17:00–18:00", activity: "Share the rationale, gather final feedback, and note what could improve the next iteration." },
      ],
      [
        "Message comprehension and visual hierarchy across intended formats",
        "Accessibility checks such as contrast, legibility, and non-color cues",
        "Consistency, production accuracy, and audience feedback for the design",
      ],
      [
        "Creative directors and brand marketers",
        "Writers, content strategists, and campaign managers",
        "Product designers and engineers for digital components",
        "Photographers, illustrators, or production vendors",
        "Accessibility, legal, and localization partners",
      ],
      [
        { period: "0–1 months", focus: "Practice composition, typography, color relationships, image use, and observing design in context.", evidence: "Explain the hierarchy and audience purpose of a small visual composition." },
        { period: "1–3 months", focus: "Build tool fluency, work from a brief, and learn to present options and receive critique.", evidence: "Create several visual directions and describe what each helps the audience notice." },
        { period: "3–6 months", focus: "Apply accessibility, responsive layout, brand systems, and production checks.", evidence: "Show one design adapted to different formats without losing clarity." },
        { period: "6–9 months", focus: "Collaborate with writing and product partners; revise work using specific feedback.", evidence: "Present an iteration with the feedback and design decision clearly documented." },
        { period: "9–12 months", focus: "Deliver a contained project from brief to handoff and reflect on its real-world use.", evidence: "Share a case study with goals, process, constraints, accessible details, and outcome." },
      ],
      {
        changing: "AI can generate references, rough visual directions, and production variations. Designers still need to judge originality, licensing, visual meaning, accessibility, and whether the work serves the brief and audience.",
        tasksToWatch: [
          "Generated imagery may contain licensing uncertainty, visual artifacts, or representations that do not fit the audience respectfully.",
          "Fast variation can create many polished options without resolving the underlying communication problem.",
        ],
        humanEdge: [
          "Set a visual direction that connects audience context, message, and brand intent.",
          "Make nuanced choices about hierarchy, craft, accessibility, and responsible use of source material.",
        ],
      },
      {
        foundation: [
          "Interest in visual communication and willingness to develop craft through repeated practice and critique.",
          "Ability to explain design choices in terms of the audience and purpose, not only personal taste.",
        ],
        helpful: [
          "Typography, layout, color, image sourcing, and a common design tool; tool choice varies by team.",
          "Accessibility, responsive formats, file preparation, and basic licensing awareness.",
        ],
        proofOfWork: [
          "A focused portfolio showing a few original projects and the thinking behind the visual choices.",
          "A before-and-after example that demonstrates critique, accessibility checks, and careful production handoff.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "content-designer",
    "content-design",
    "Content Creation / Design",
    "Content Designer",
    "Use clear, considerate language to help people move through a product.",
    12,
    illustrativeContent(
      "This path may suit someone who uses language to make complex services easier to understand and navigate. Content designers work on interface text, service journeys, naming, and guidance, often alongside research, product, and engineering teams. The goal is not simply to polish words after a screen is built: content choices shape the experience and need to work for different users, including people under stress or with varied language and access needs.",
      [
        { time: "09:00–10:00", activity: "Review support questions, content feedback, and planned product changes that affect user understanding." },
        { time: "10:00–11:00", activity: "Map a user journey with design and product partners, identifying where language is doing too much or too little." },
        { time: "11:00–12:00", activity: "Review existing interface text and research evidence, noting confusing terms and unanswered questions." },
        { time: "12:00–13:00", activity: "Draft and test labels, instructions, and error messages in the context of the full flow." },
        { time: "13:00–14:00", activity: "Take lunch and reset before reviewing the copy again." },
        { time: "14:00–15:00", activity: "Pair with design and engineering on layout limits, translation needs, and assistive-technology behavior." },
        { time: "15:00–16:00", activity: "Check content with legal or subject experts for accuracy, plain language, and required disclosures." },
        { time: "16:00–17:00", activity: "Review user feedback or a usability session to see whether wording supports the task." },
        { time: "17:00–18:00", activity: "Document content decisions, unresolved terminology, and what to validate after implementation." },
      ],
      [
        "Task completion and comprehension for key instructions or decisions",
        "Content-related support contacts, errors, and points where people abandon a flow",
        "Accessibility, translation readiness, and consistency of terminology",
      ],
      [
        "Product designers and product managers",
        "Researchers and content strategists",
        "Engineers and quality engineers",
        "Legal, policy, and subject-matter experts",
        "Localization, accessibility, and customer-support partners",
      ],
      [
        { period: "0–1 months", focus: "Practice plain language, information hierarchy, editing, and reading interfaces in context.", evidence: "Rewrite a confusing instruction and explain how it supports a user's next step." },
        { period: "1–3 months", focus: "Learn interface patterns, content critique, accessibility, and how product teams make decisions.", evidence: "Create a small flow with helpful labels, instructions, errors, and confirmation messages." },
        { period: "3–6 months", focus: "Use research or usability feedback to revise content and work with design and engineering partners.", evidence: "Show how evidence changed a content choice and what still needs testing." },
        { period: "6–9 months", focus: "Practice terminology systems, localization considerations, and content quality checks.", evidence: "Prepare a glossary and content checklist for a small multi-step service." },
        { period: "9–12 months", focus: "Support a contained service improvement through discovery, implementation, and evaluation.", evidence: "Present the journey, content decisions, accessibility considerations, and learning after release." },
      ],
      {
        changing: "AI can draft interface language, suggest alternatives, and help check consistency. Content designers remain responsible for meaning, tone, accessibility, policy accuracy, localization context, and how words behave in the product.",
        tasksToWatch: [
          "Generated copy can sound fluent while being vague, inaccessible, too forceful, or inaccurate about what a service will do.",
          "Automated translation or tone changes can alter legal meaning, cultural nuance, or the clarity of an important instruction.",
        ],
        humanEdge: [
          "Understand the user's task and make language fit the moment, constraints, and level of uncertainty.",
          "Resolve terminology with partners and test whether real people understand what the product is asking of them.",
        ],
      },
      {
        foundation: [
          "Strong interest in language, clarity, and the way product decisions affect people's choices.",
          "Comfort revising work with a team and explaining why a word or instruction matters in context.",
        ],
        helpful: [
          "Editing, plain-language writing, interface patterns, accessibility, and collaboration with product teams.",
          "Research and localization awareness; a portfolio can be built through volunteer or self-directed projects.",
        ],
        proofOfWork: [
          "A short interface case study showing the user journey, original content problem, and considered revisions.",
          "Examples of clear error, confirmation, or guidance content with notes on accessibility and validation.",
        ],
      },
    ),
  ),
  {
    slug: "core-product-manager",
    familySlug: "product-manager",
    familyTitle: "Product Manager",
    title: "Core Product Manager",
    summary: "Help a team decide what problem to solve, what to build, and how to learn.",
    status: "illustrative",
    sortOrder: 13,
    content: illustrativeContent(
      "This path may suit someone who likes connecting user problems, business needs, and technical possibilities. It involves making choices with incomplete information and explaining why some good ideas are not the next priority. The work is not simply scheduling meetings or writing requirements: a product manager is accountable for helping a team learn whether its work made a meaningful difference.",
      [
        { time: "09:00–10:00", activity: "Review product outcomes, customer feedback, open decisions, and the team's current commitments." },
        { time: "10:00–11:00", activity: "Check in with design and engineering on blockers, decisions, and changes in scope or risk." },
        { time: "11:00–12:00", activity: "Talk with users or customer-facing teams to understand a recurring problem and its context." },
        { time: "12:00–13:00", activity: "Refine a problem brief: who is affected, what is known, and what the team still needs to learn." },
        { time: "13:00–14:00", activity: "Take lunch; avoid turning every gap into another meeting." },
        { time: "14:00–15:00", activity: "Compare solution options with design and engineering, including risks, costs, and dependencies." },
        { time: "15:00–16:00", activity: "Prioritize with partners, explain what will wait, and record the assumptions behind the choice." },
        { time: "16:00–17:00", activity: "Check launch or experiment readiness, including support, operations, privacy, and rollback needs." },
        { time: "17:00–18:00", activity: "Share what is known, what remains uncertain, and the owner and timing of the next decision." },
      ],
      [
        "User task success and recurring friction",
        "Adoption, engagement, or retention tied to a clearly stated product goal",
        "Quality, reliability, and support signals alongside delivery progress",
      ],
      [
        "People using the product",
        "Design, engineering, and data partners",
        "Customer support and sales",
        "Business or operations leaders",
        "Legal, privacy, or security reviewers when relevant",
      ],
      [
        { period: "0–1 months", focus: "Practice observing user problems, writing concise summaries, and separating evidence from assumptions.", evidence: "Turn a familiar frustration into a clear problem question before suggesting a solution." },
        { period: "1–3 months", focus: "Learn discovery, prioritization, basic metrics, and how software teams plan and deliver work.", evidence: "Write a problem brief with a user, supporting evidence, and a learning goal." },
        { period: "3–6 months", focus: "Work through a small discovery or delivery exercise with design and engineering partners.", evidence: "Show where evidence, feasibility, or user feedback changed the plan." },
        { period: "6–9 months", focus: "Practice decision records, trade-off communication, and checking outcomes after release.", evidence: "Present a decision, its assumptions, and what the team learned afterward." },
        { period: "9–12 months", focus: "Contribute to a product team or take on a bounded problem with regular guidance and feedback.", evidence: "Explain the outcome, unintended effects, and the next decision—not just what shipped." },
      ],
      {
        changing: "AI can help organize notes, draft specifications, and compare options quickly. Product managers still need to verify evidence, align people on trade-offs, and take responsibility for outcomes.",
        tasksToWatch: [
          "Generated summaries can omit minority views, lose context, or turn assumptions into confident-sounding requirements.",
          "Automated analysis can miss how a metric is defined, which users are excluded, or whether a change caused the result.",
        ],
        humanEdge: [
          "Build shared understanding across people with different goals and levels of context.",
          "Choose useful evidence, make explicit trade-offs, and remain accountable after launch.",
        ],
      },
      {
        foundation: [
          "Clear writing, curiosity about user problems, and comfort asking follow-up questions across different roles.",
          "Willingness to make, explain, and revisit decisions when evidence changes.",
        ],
        helpful: [
          "Basic data literacy, product discovery, software delivery, and collaborative planning; build these through practice or adjacent roles.",
          "Experience working across disciplines or taking a project from idea to feedback can help, but is not the only route in.",
        ],
        proofOfWork: [
          "A problem brief showing who is affected, the evidence, alternative options, and how to learn whether a change helped.",
          "A project reflection that explains trade-offs, what did not work, and how you would respond to new evidence.",
        ],
      },
    ),
  },
  illustrativeRole(
    "growth-product-manager",
    "product-manager",
    "Product Manager",
    "Growth Product Manager",
    "Explore how product experiences support discovery, activation, and retention.",
    14,
    illustrativeContent(
      "This path may suit someone who wants to understand how people discover, begin using, and continue to benefit from a product. Growth product managers work with design, engineering, analytics, and marketing to identify friction and run responsible experiments. The work is not simply maximizing sign-ups: sustainable growth depends on the value users receive, the quality of measurement, and safeguards against manipulative or exclusionary choices.",
      [
        { time: "09:00–10:00", activity: "Review funnel health, experiment status, customer feedback, and guardrail metrics." },
        { time: "10:00–11:00", activity: "Discuss a journey drop-off with analytics, design, and marketing partners." },
        { time: "11:00–12:00", activity: "Check event definitions and segment behavior to distinguish a real pattern from tracking noise." },
        { time: "12:00–13:00", activity: "Frame a user problem and draft an experiment hypothesis with a clear comparison." },
        { time: "13:00–14:00", activity: "Take lunch and step away from the dashboard." },
        { time: "14:00–15:00", activity: "Compare solution options with engineering and design, including user benefit and implementation risk." },
        { time: "15:00–16:00", activity: "Set success and stop criteria, including quality, accessibility, privacy, and customer-experience guardrails." },
        { time: "16:00–17:00", activity: "Review experiment readiness and communicate what the test can and cannot answer." },
        { time: "17:00–18:00", activity: "Document the decision, ownership, and follow-up plan regardless of the test result." },
      ],
      [
        "Activation and meaningful product use among eligible people",
        "Retention or repeat value, not just acquisition volume",
        "Experiment guardrails such as errors, complaints, exclusion, and long-term user outcomes",
      ],
      [
        "Product designers and engineers",
        "Data analysts and experimentation partners",
        "Marketing, sales, and customer-success teams",
        "Privacy, accessibility, and legal reviewers",
        "People using or considering the product",
      ],
      [
        { period: "0–1 months", focus: "Learn product funnels, user research basics, spreadsheets, and how growth metrics are defined.", evidence: "Map a simple journey and identify one user problem without jumping to a tactic." },
        { period: "1–3 months", focus: "Practice hypothesis writing, event-quality checks, prioritization, and experiment guardrails.", evidence: "Write an experiment brief with eligibility, comparison, primary measure, and stop conditions." },
        { period: "3–6 months", focus: "Work through a small growth problem with design, engineering, and analytics partners.", evidence: "Show how evidence changed the proposed intervention or the team's confidence." },
        { period: "6–9 months", focus: "Study cohort behavior, retention, and ethical risks of optimization choices.", evidence: "Present results with uncertainty and explain any trade-off to user experience." },
        { period: "9–12 months", focus: "Own a bounded journey improvement from problem discovery through post-test decision.", evidence: "Describe the user value, result, guardrails, and follow-up learning." },
      ],
      {
        changing: "AI can suggest funnel analyses, summarize feedback, and generate experiment ideas. Product managers still need to validate data, choose interventions that help users, and avoid optimizing proxies that conflict with long-term value.",
        tasksToWatch: [
          "Generated analysis can assume a causal explanation from observational data or miss changes in who was included.",
          "Automated personalization can introduce unfair targeting, privacy concerns, or pressure to optimize engagement at users' expense.",
        ],
        humanEdge: [
          "Connect growth opportunities to a real user benefit and durable product value.",
          "Set responsible guardrails, interpret uncertain evidence, and explain decisions across functions.",
        ],
      },
      {
        foundation: [
          "Curiosity about why people start, stop, or return to a product, paired with empathy for their goals.",
          "Comfort using evidence to revisit assumptions and explaining trade-offs plainly.",
        ],
        helpful: [
          "Product discovery, basic analytics, experimentation concepts, and collaborative software delivery.",
          "Awareness of privacy, accessibility, and ethical design; prior growth-team experience is not required everywhere.",
        ],
        proofOfWork: [
          "A journey analysis that identifies a user problem and distinguishes evidence from assumptions.",
          "An experiment plan with a meaningful user outcome, guardrails, and an interpretation plan for mixed results.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "technical-product-manager",
    "product-manager",
    "Product Manager",
    "Technical Product Manager",
    "Coordinate product decisions around technical capabilities and constraints.",
    15,
    illustrativeContent(
      "This path may suit someone who enjoys translating between technical systems and the people or teams that depend on them. Technical product managers often work on APIs, infrastructure, developer tools, data platforms, or complex integrations. They do not need to be the engineer, but they do need to understand constraints well enough to help a team make coherent choices and explain how those choices support a product or business need.",
      [
        { time: "09:00–10:00", activity: "Review service or platform health, technical dependencies, delivery risks, and open product decisions." },
        { time: "10:00–11:00", activity: "Check in with engineering leads on reliability, migration, or integration constraints." },
        { time: "11:00–12:00", activity: "Talk with internal or external users to understand where a technical capability blocks their work." },
        { time: "12:00–13:00", activity: "Refine a problem brief and map affected systems, users, and operational requirements." },
        { time: "13:00–14:00", activity: "Take lunch and leave room for focused technical reading." },
        { time: "14:00–15:00", activity: "Compare implementation options with engineering, including reliability and migration implications." },
        { time: "15:00–16:00", activity: "Coordinate a decision with security, data, or operations partners and record assumptions." },
        { time: "16:00–17:00", activity: "Clarify API or platform requirements and identify how consumers will test or adopt a change." },
        { time: "17:00–18:00", activity: "Share the decision, dependencies, and remaining technical questions with stakeholders." },
      ],
      [
        "Reliability and performance of the capability or integration",
        "Adoption, task success, and support burden for technical users",
        "Migration safety, compatibility, and operational readiness",
      ],
      [
        "Software, infrastructure, and security engineers",
        "Developers or teams consuming a platform or API",
        "Product managers and designers",
        "Data, operations, and support teams",
        "Business partners affected by reliability or integration choices",
      ],
      [
        { period: "0–1 months", focus: "Learn software delivery, APIs, data basics, system diagrams, and how to ask engineers useful questions.", evidence: "Explain a simple service interaction and identify what could fail between components." },
        { period: "1–3 months", focus: "Practice technical discovery, dependency mapping, requirements, and concise decision records.", evidence: "Write a problem brief and compare two plausible technical approaches." },
        { period: "3–6 months", focus: "Work with engineers on a bounded integration, reliability, or developer-experience problem.", evidence: "Show how user needs and technical constraints shaped scope." },
        { period: "6–9 months", focus: "Study compatibility, migrations, security review, and platform adoption signals.", evidence: "Create a rollout or migration plan with safeguards and communication steps." },
        { period: "9–12 months", focus: "Coordinate a technical product initiative from user problem through operational follow-up.", evidence: "Present the decision, dependencies, reliability outcome, and what consumers learned." },
      ],
      {
        changing: "AI can explain unfamiliar code, draft technical documentation, and summarize implementation alternatives. Product managers still need to check those explanations with system owners and understand reliability, security, and compatibility implications.",
        tasksToWatch: [
          "Generated technical summaries can miss undocumented dependencies, data boundaries, or operational failure modes.",
          "Plausible architecture recommendations may optimize local convenience while increasing long-term system complexity.",
        ],
        humanEdge: [
          "Build shared understanding between users of a system and the teams responsible for it.",
          "Ask precise questions, surface dependencies early, and balance capability, reliability, and maintainability.",
        ],
      },
      {
        foundation: [
          "Interest in how software systems fit together and how technical choices affect people and teams.",
          "Clear communication and comfort learning unfamiliar concepts without pretending to be the system expert.",
        ],
        helpful: [
          "API and database basics, software delivery, technical writing, and collaborative planning.",
          "Experience in engineering, support, operations, implementation, or another adjacent role can help but is not a universal prerequisite.",
        ],
        proofOfWork: [
          "A technical product brief that connects a user need to system constraints, alternatives, and success signals.",
          "A dependency or rollout plan that names compatibility, reliability, and operational considerations.",
        ],
      },
    ),
  ),
  illustrativeRole(
    "platform-product-manager",
    "product-manager",
    "Product Manager",
    "Platform Product Manager",
    "Shape internal capabilities that help other teams build reliably.",
    16,
    illustrativeContent(
      "This path may suit someone who likes helping other teams work more effectively through shared systems, tools, and services. Platform product managers serve internal developers or operations teams as users, balancing immediate usability with reliability, governance, and long-term maintainability. Success is not measured by how many features a platform ships; it depends on whether teams can safely do useful work with less friction.",
      [
        { time: "09:00–10:00", activity: "Review platform reliability, adoption, support requests, and current delivery commitments." },
        { time: "10:00–11:00", activity: "Meet with an internal team to understand a workflow blocked by a shared tool or service." },
        { time: "11:00–12:00", activity: "Map the developer journey and distinguish a platform gap from a local process issue." },
        { time: "12:00–13:00", activity: "Prioritize an improvement with engineering, considering adoption cost and downstream dependencies." },
        { time: "13:00–14:00", activity: "Take lunch and allow time for focused documentation review." },
        { time: "14:00–15:00", activity: "Review service ownership, access, support, and migration expectations with platform partners." },
        { time: "15:00–16:00", activity: "Test a proposed workflow with a consuming team and collect friction points." },
        { time: "16:00–17:00", activity: "Coordinate rollout, documentation, and deprecation communication across affected teams." },
        { time: "17:00–18:00", activity: "Record adoption signals, reliability risks, and the next feedback checkpoint." },
      ],
      [
        "Reliability and usability of shared capabilities for their intended users",
        "Adoption, time to complete common workflows, and avoidable support requests",
        "Migration safety, service ownership, and consistency of platform practices",
      ],
      [
        "Internal developers and operations teams",
        "Platform and infrastructure engineers",
        "Security, privacy, and compliance partners",
        "Product managers for consuming products",
        "Support and technical-writing partners",
      ],
      [
        { period: "0–1 months", focus: "Learn platform concepts, internal customer interviews, service ownership, and workflow mapping.", evidence: "Map one developer workflow and identify the evidence behind its friction points." },
        { period: "1–3 months", focus: "Practice platform discovery, prioritization, documentation review, and reliability basics.", evidence: "Write an internal-user problem brief with a clear outcome and adoption barrier." },
        { period: "3–6 months", focus: "Work with a platform team on a contained capability or developer-experience improvement.", evidence: "Show how feedback from a consuming team changed the solution or rollout." },
        { period: "6–9 months", focus: "Learn migration planning, service-level expectations, support models, and change communication.", evidence: "Create a rollout plan that includes compatibility, ownership, and a safe fallback." },
        { period: "9–12 months", focus: "Coordinate a platform improvement through adoption and follow-up with internal users.", evidence: "Present the user problem, reliability considerations, adoption evidence, and next investment." },
      ],
      {
        changing: "AI can help summarize internal feedback, draft documentation, and explore workflow prototypes. Platform product managers still need to validate needs with teams, check policy and security constraints, and understand the operational costs of shared capabilities.",
        tasksToWatch: [
          "AI-generated documentation can become stale or omit critical access, security, and support requirements.",
          "Automated suggestions may optimize the most vocal team's workflow while adding complexity for other platform users.",
        ],
        humanEdge: [
          "Understand the needs of different internal teams and make shared capabilities coherent rather than one-off.",
          "Coordinate adoption, ownership, reliability, and change management across teams with different constraints.",
        ],
      },
      {
        foundation: [
          "Interest in helping other teams do their work and willingness to investigate the systems behind a workflow.",
          "Clear communication, follow-through, and comfort balancing local requests with shared needs.",
        ],
        helpful: [
          "Software delivery, APIs or infrastructure concepts, customer discovery, documentation, and service reliability basics.",
          "Experience in engineering, developer support, operations, or internal tooling can be relevant; paths vary by organization.",
        ],
        proofOfWork: [
          "A platform improvement proposal grounded in internal-user evidence and a clear adoption outcome.",
          "A sample rollout or migration plan that accounts for documentation, ownership, compatibility, and feedback.",
        ],
      },
    ),
  ),
];
