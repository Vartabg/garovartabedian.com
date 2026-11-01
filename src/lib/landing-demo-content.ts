/** Fictional business copy for the landing-page example, never a client claim. */
export const LANDING_DEMO = {
  brand: "Good Measure",
  descriptor: "Independent bookkeeping",
  href: "/work/landing-page",
  title: "Good Measure — a landing page to try",
  description:
    "Explore a fictional bookkeeper’s landing page and try its local inquiry preview. Part of the $100 total three-item business package.",
  headline: ["Your books,", "in good order."],
  introduction:
    "Bookkeeping for freelancers and small service businesses. Monthly records, a backlog to sort, or a spreadsheet that needs a sensible system.",
  services: [
    {
      number: "01",
      id: "monthly",
      title: "Monthly bookkeeping",
      description:
        "Keep the regular work moving: organize transactions, match records to statements, and put the month’s figures in one place.",
      detail: "For a routine you can keep",
    },
    {
      number: "02",
      id: "catch-up",
      title: "Catch-up & cleanup",
      description:
        "Start with what you have. Sort a backlog, flag missing records, and work through the questions before moving forward.",
      detail: "For the pile you’ve been putting off",
    },
    {
      number: "03",
      id: "spreadsheets",
      title: "Spreadsheet organization",
      description:
        "Give income and expenses a consistent home, with clear categories and a layout that makes the next entry easier.",
      detail: "For a system that fits your work",
    },
  ],
  process: [
    {
      title: "A short conversation.",
      description:
        "What do you do, what records do you keep, and what needs attention? Start there.",
    },
    {
      title: "A scope in writing.",
      description:
        "Agree on the work, the records needed, the price, and the timing before anything starts.",
    },
    {
      title: "A clear handover.",
      description:
        "Walk through the organized records, open questions, and what to keep ready for next time.",
    },
  ],
} as const;

export const LANDING_INQUIRY_OPTIONS = {
  business: [
    "Freelancer / independent professional",
    "Solo service business",
    "Small service team",
    "Another small business",
  ],
  task: LANDING_DEMO.services.map((service) => service.title),
  records: [
    "A spreadsheet",
    "Bookkeeping software",
    "Statements and receipts",
    "A mix of records / not sure yet",
  ],
  timing: ["Exploring options", "Within the next month", "A backlog needs attention"],
} as const;
