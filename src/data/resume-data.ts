import type { ResumeData } from "../lib/types.ts";

// Source of truth for every word on the page. Facts and wording come from
// job-hunt (profiles and og-resume, content pull of 2026-10-13); site counts
// and the Balenciaga square feet follow the map records (Cody, 2026-10-14).
// Never rewrite a fact for layout reasons. No dollar figures, no email, no
// em or en dashes: pnpm check:data enforces all three.
export const RESUME_DATA: ResumeData = {
  name: "Cody Mitchell",
  initials: "CM",
  tagline: "Senior Facilities Manager for multi-site portfolios and new site openings",
  location: "Chicago, IL · Open to relocation",
  locationLink: "https://www.google.com/maps/place/Chicago",
  about: "Facilities, Operations & New Site Launches",
  summary:
    "9 brands, 400+ locations, 2.8M+ sq ft managed, from luxury maisons and flexible coworking to launching Rivian’s East Coast service centers. Solo and with incredible teams.",
  personalWebsiteUrl: "https://codymitch.works",
  updated: "2026-10-13",
  pdf: null,
  pdfPending: "Building the PDF. Check back soon.",
  contact: {
    social: [
      {
        name: "GitHub",
        url: "https://github.com/hey-codes",
        icon: "github",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/codestergram/",
        icon: "instagram",
        handle: "@codestergram",
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/heycody/",
        icon: "linkedin",
      },
    ],
  },
  stats: [
    { value: "13", label: "Years in FM" },
    { value: "400+", label: "Locations" },
    { value: "2.8M+", label: "Sq ft managed" },
    { value: "9", label: "Brands" },
  ],
  map: {
    title: "Every location",
    caption: "400+ sites · 9 brands · 2013 to 2026",
    // Cody, 2026-10-15: the pick model's two halves.
    hint: "Hover a role to preview, click to keep it",
    hintNarrow: "Every site, 2013 to 2026",
    label: "Map of locations managed, 2013 to 2026",
    controls: { zoomIn: "Zoom in", zoomOut: "Zoom out", close: "Close popup" },
    hoverMore: "{name} +{n}",
    // Approved by Cody, 2026-10-15.
    hoverOpenings: { one: "{n} project", other: "{n} projects" },
    // Cody, 2026-10-15: a static key to the red diamond, inside the map's frame.
    legend: { nso: "NEW SITE OPENING", construction: "IN CONSTRUCTION", relocation: "RELOCATION", renovation: "RENOVATION" },
    card: {
      type: "TYPE",
      sqft: "SQ FT",
      opening: "PROJECT",
      estimated: "Est.",
      // Cody, 2026-10-15: one name per project type, replacing opened and supported.
      flags: { nso: "NSO", construction: "IN CONSTRUCTION", relocation: "RELOCATION", renovation: "RENOVATION" },
      allSites: "All {n} sites",
      readRole: "Role ↓",
      sitesHere: "{n} sites here",
      // Approved by Cody, 2026-10-15.
      market: "MARKET",
      chips: { flagship: "FLAGSHIP", office: "OFFICE", flexOffice: "FLEX OFFICE", closed: "CLOSED" },
    },
    reset: "Show every site",
  },
  // Approved by Cody, 2026-10-15.
  footer: {
    updated: "UPDATED",
    built: {
      key: "BUILT",
      items: [
        { name: "Next.js", url: "https://nextjs.org/" },
        { name: "MapLibre", url: "https://maplibre.org/" },
        { name: "mapcn", url: "https://mapcn.dev/" },
        { name: "Vercel", url: "https://vercel.com/" },
      ],
    },
    type: {
      key: "TYPE",
      items: [
        { name: "Fraunces", url: "https://fonts.google.com/specimen/Fraunces" },
        { name: "Geist", url: "https://vercel.com/font" },
        { name: "JetBrains Mono", url: "https://www.jetbrains.com/lp/mono/" },
      ],
    },
  },
  education: [
    {
      school: "University of Colorado Boulder",
      link: "https://www.colorado.edu/envd",
      location: "Boulder, CO",
      degree:
        "Bachelor of Environmental Design (B.EnvD): Architecture. College of Architecture & Planning.",
      year: "2012",
    },
  ],
  affiliations: [{ key: "MEMBER", text: "Connex (formerly PRSM), former member" }],
  careerHighlights: [
    {
      key: "FIRST HIRE",
      title: "2× first FM hire",
      text: "Built the budget, CMMS, and vendor network from scratch at FENDI Americas and Balenciaga.",
    },
    {
      key: "RANGE",
      title: "13 years, 9 brands, 400+ locations",
      text: "From Facilities Coordinator to Americas FM, across luxury retail, boutique fitness, EV service centers, a thermal spa, and coworking offices. **2.8M+** sq ft.",
    },
    {
      key: "SYSTEMS",
      title: "3 new CMMS implementations",
      text: "ServiceChannel at FENDI and Balenciaga, FEXA at Rivian. Inherited or expanded systems at **4** more brands.",
    },
    {
      key: "LEGACY",
      title: "Harvey Milk memorial",
      text: "Coordinated the vendors and contacts [SF Illuminate](https://illuminate.org/) brought for the permanent “HOPE WILL NEVER BE SILENT” neon at SoulCycle Castro, for Milk’s **40th** election anniversary.",
    },
  ],
  work: [
    {
      company: "Industrious",
      link: "https://www.industriousoffice.com/",
      location: "Chicago, IL (remote)",
      title: "Facilities Consultant (Contract)",
      start: "Apr 2026",
      end: "Aug 2026",
      sites: 51,
      sector: "Flex and Coworking",
      sqft: "1.2M+ sq ft",
      cmms: ["FEXA"],
      context: "parental leave cover for the Facilities Manager, Western U.S.",
      description:
        "Owned repairs and maintenance for 51 coworking offices (1.2M+ sq ft) in the Western U.S. and oversaw 1,500+ FEXA work orders. Stepped in on a day’s notice for the Facilities Manager’s parental leave (contract extended).",
      highlights: [
        "Learned the brand’s standards, sites, and vendors in **14 days**, then carried the daily repair queue for all **5 districts**.",
      ],
      // DETAILS chips: the top three LinkedIn-linked skills per entry (job-hunt
      // copy/linkedin.md 10.3) and awards (Cody, 2026-10-15). The TOOLS row is
      // not here: it reads the role's apps from tools.apps.
      details: [
        { label: "Skill", value: "Office Operations" },
        { label: "Skill", value: "Multi-location Management" },
        { label: "Skill", value: "Key Performance Indicators" },
      ],
    },
    {
      company: "Independent",
      location: "New York, NY and Chicago, IL",
      title: "Facilities Consultant",
      start: "Feb 2024",
      end: "Present",
      sites: 4,
      countWord: "clients",
      cmms: [],
      context: "FM and business admin support for 4 small businesses",
      description:
        "FM and business admin support for 4 small businesses: a NYC restaurant group plus retail and landscaping clients.",
      details: [
        { label: "Skill", value: "Facilities Management" },
        { label: "Skill", value: "Vendor Management" },
        { label: "Skill", value: "Maintenance Management" },
      ],
    },
    {
      company: "Bathhouse",
      link: "https://www.abathhouse.com/",
      location: "New York, NY",
      title: "Facilities & Operations Manager",
      start: "Jul 2024",
      end: "Nov 2024",
      sites: 1,
      sector: "Thermal Wellness",
      sqft: "35,000 sq ft",
      cmms: ["MaintainX"],
      context: "co-ed thermal spa where bitcoin miners heated the 2 hot pools",
      description:
        "Oversaw facilities and daily operations for a 35,000 sq ft luxury thermal spa in Manhattan serving 150 to 350 guests a day: 6 pools, saunas, 20 treatment rooms, a full-service kitchen, and a commercial laundry.",
      highlights: [
        "Cut facilities OPEX **18%** in the first 3 months by bringing outsourced repairs in-house and sourcing parts through new distributors.",
      ],
      details: [
        { label: "Skill", value: "Hospitality Management" },
        { label: "Skill", value: "Cross-functional Team Leadership" },
        { label: "Skill", value: "Software Implementation" },
      ],
    },
    {
      company: "Balenciaga",
      link: "https://www.balenciaga.com/en-us",
      location: "New York, NY",
      title: "Facilities Manager, Americas",
      start: "Aug 2022",
      end: "Dec 2023",
      sites: 56,
      sector: "Luxury Retail",
      sqft: "185K+ sq ft",
      cmms: ["ServiceChannel"],
      context: "acting project manager on the delayed Miami Design District flagship",
      description:
        "First facilities hire globally, for 55 boutiques (185K+ sq ft) in the U.S. and Canada plus the 80+ person NYC HQ. Built a team of 3 and secured an OPEX budget that nearly tripled.",
      highlights: [
        "Set up ServiceChannel and built leadership’s first spend and KPI dashboards from **1,600+** work orders in year one.",
      ],
      details: [
        { label: "Skill", value: "Opening New Locations" },
        { label: "Skill", value: "Program Management" },
        { label: "Skill", value: "Software Implementation" },
      ],
    },
    {
      company: "Rivian Automotive",
      short: "Rivian",
      link: "https://rivian.com/",
      location: "Brooklyn, NY (remote)",
      title: "Commercial Facilities Operations, Specialist",
      start: "Apr 2021",
      end: "Jul 2022",
      sites: 6,
      sitesLabel: "opened",
      mapSites: 11,
      sector: "EV and Automotive",
      sqft: "200K+ sq ft",
      cmms: ["Limble", "FEXA"],
      context: "hybrid role: new site openings plus day-to-day FM",
      description:
        "Opened 6 East Coast service centers (200K+ sq ft), on site for the 2 weeks before each, then stayed on as their FM. Each ran from construction walkthroughs and readiness checks through site setup and opening day.",
      highlights: [
        "Co-led biweekly new site opening (NSO) calls for **40+** people across **8** teams, including Real Estate, Construction, Design, EHS, and Security.",
      ],
      details: [
        { label: "Skill", value: "Launch Operations" },
        { label: "Skill", value: "Program Management" },
        { label: "Skill", value: "Software Implementation" },
      ],
    },
    {
      company: "FENDI",
      link: "https://www.fendi.com/us-en/",
      location: "New York, NY",
      title: "Facilities Manager, Americas",
      start: "Dec 2018",
      end: "Apr 2021",
      sites: 67,
      sector: "Luxury Retail",
      sqft: "220K+ sq ft",
      cmms: ["ServiceChannel"],
      context: "first FM hire for the Americas, a team of 1 across 3 countries",
      description:
        "Built FENDI’s Americas FM program from the ground up, solo, for 67 boutiques (220K+ sq ft) in the U.S., Canada, and Mexico plus the 90+ person NYC HQ. Supported 6 openings and secured a larger R&M budget.",
      highlights: [
        "Replaced spreadsheets and paper invoices with ServiceChannel, live in the U.S. in **4.5 weeks** against a **12-week** standard, then tied it into SAP as the first LVMH brand to pilot the integration.",
      ],
      details: [
        { label: "Skill", value: "Opening New Locations" },
        { label: "Skill", value: "Software Implementation" },
        { label: "Skill", value: "Loss Prevention" },
        { label: "Award", value: "Above & Beyond" },
      ],
    },
    {
      company: "Dolce & Gabbana",
      link: "https://www.dolcegabbana.com/en-us/",
      location: "New York, NY",
      title: "Facilities Manager, Americas",
      start: "Jul 2018",
      end: "Dec 2018",
      sites: 52,
      sector: "Luxury Retail",
      sqft: "190K+ sq ft",
      cmms: ["ServiceChannel"],
      context: "U.S. and Canada portfolio; recruited away by FENDI",
      description:
        "Sole FM for 52 boutiques (190K+ sq ft) in the U.S. and Canada. Audited and finished an inherited ServiceChannel rollout to full adoption; recruited away by FENDI.",
      details: [
        { label: "Skill", value: "Luxury Retail" },
        { label: "Skill", value: "Contract Management" },
        { label: "Skill", value: "Multi-location Management" },
      ],
    },
    {
      company: "SoulCycle",
      link: "https://www.soul-cycle.com/",
      location: "New York, NY and San Francisco, CA",
      title: "Area Facilities Manager",
      start: "Apr 2015",
      end: "Jun 2018",
      sites: 34,
      sector: "Boutique Fitness",
      sqft: "100K+ sq ft",
      cmms: ["ServiceChannel"],
      context: "indoor cycling studios in 5 markets, U.S. and Canada",
      description:
        "Area FM with 1 direct report, covering 10 to 15 high-ridership studios at a time across 5 markets (34 over 3 years, 100K+ sq ft). Helped open 16, and relocated to San Francisco in 2016 to bring NorCal back to brand standards.",
      highlights: [
        "Managed the area’s yearly OPEX and **2 to 4** CapEx projects a year per studio.",
      ],
      details: [
        { label: "Skill", value: "Facilities Project Management" },
        { label: "Skill", value: "Launch Operations" },
        { label: "Skill", value: "Opening New Locations" },
        { label: "Award", value: "Soulccolade" },
      ],
    },
    {
      company: "J.Crew / Madewell",
      display: "J.Crew and Madewell",
      short: "J.Crew",
      // Each brand in the display gets its own ↗ (Cody, 2026-10-15).
      links: [
        { name: "J.Crew", url: "https://www.jcrew.com/" },
        { name: "Madewell", url: "https://www.madewell.com/" },
      ],
      location: "New York, NY",
      title: "Facilities Coordinator",
      start: "Mar 2013",
      end: "Apr 2015",
      sites: 159,
      sector: "Multi-Unit Retail",
      sqft: "700K+ sq ft",
      cmms: ["ServiceChannel"],
      context: "NYC Metro, all of Madewell, and J.Crew West",
      description:
        "R&M and CapEx for up to 159 stores (700K+ sq ft) in NYC Metro, Madewell, and J.Crew West. Promoted to facilities in 2013 after the sales floor in Broomfield, CO (2010) and men’s merchandising at the NYC flagship (2012).",
      highlights: [
        "Revamped back-of-house layouts at **13** top NYC stores to raise usable storage from about **30% to 55%**.",
      ],
      details: [
        { label: "Skill", value: "Facilities Project Management" },
        { label: "Skill", value: "Opening New Locations" },
        { label: "Skill", value: "Multi-location Management" },
      ],
    },
  ],
  skills: [
    {
      key: "OPS",
      category: "Operations",
      items: [
        "New Site Openings (NSO)",
        "Multi-Site Portfolios",
        "Workplace Operations",
        "Landlord Relations",
        "Construction Coordination",
        "Team Leadership & Training",
      ],
    },
    {
      key: "PROGRAMS",
      category: "Programs",
      items: [
        "CMMS Implementation",
        "Preventive Maintenance Programs",
        "Site Audits & Brand Standards",
        "SOP Development",
        "KPI & SLA Tracking",
        "Health & Safety Compliance",
        "Security Programs",
        "AI Workflow Automation",
      ],
    },
    {
      key: "FINANCE",
      category: "Finance & Vendors",
      items: ["CapEx & OPEX Planning", "R&M Forecasting", "Vendor Sourcing & Management", "RFP Development"],
    },
    {
      key: "MEP",
      category: "Building Systems (MEP)",
      items: ["HVAC", "Plumbing", "Electrical", "Fire/Life Safety", "EV Charging", "Pool & Spa Systems", "BMS"],
    },
  ],
  // The STACK block. Each name maps to the employers (exact work[].company)
  // it was used at, or "Personal"; rows trace those roles on the map. A role's
  // TOOLS row in DETAILS is read from apps (Cody, 2026-10-15).
  tools: {
    cmms: {
      ServiceChannel: ["FENDI", "Balenciaga", "Dolce & Gabbana", "SoulCycle", "J.Crew / Madewell"],
      FEXA: ["Rivian Automotive", "Industrious"],
      MaintainX: ["Bathhouse"],
      Limble: ["Rivian Automotive"],
    },
    // A to Z, case-insensitive; the rows render in this order. Each list is
    // in page order, with "Personal" (used on his own, not at a role) last.
    apps: {
      Airtable: ["Balenciaga", "Rivian Automotive"],
      Asana: ["Bathhouse"],
      "Autodesk Construction Cloud": ["Rivian Automotive"],
      ChatGPT: ["Personal"],
      "Claude AI": ["Industrious", "Personal"],
      Confluence: ["Rivian Automotive"],
      Coupa: ["Industrious", "Rivian Automotive"],
      Cursor: ["Personal"],
      Figma: ["Rivian Automotive", "Personal"],
      GitHub: ["Personal"],
      "Google Workspace": ["Industrious", "Bathhouse", "SoulCycle", "Personal"],
      "Microsoft Office": ["Balenciaga", "FENDI", "J.Crew / Madewell"],
      "monday.com": ["SoulCycle"],
      Notion: ["Personal"],
      Obsidian: ["Personal"],
      Procore: ["Rivian Automotive", "FENDI", "SoulCycle"],
      Slack: ["Industrious", "Bathhouse", "SoulCycle"],
      Smartsheet: ["Rivian Automotive", "SoulCycle"],
      Trello: ["Rivian Automotive"],
    },
  },
  // Not shown on the page. Clients are described by business type only: no
  // business names or towns (Cody, 2026-10-14).
  projects: [
    {
      title: "Men’s salon",
      techStack: ["Website Revamp", "Brand Visibility", "Space Design"],
      description:
        "Revamping business website, increasing brand visibility, and optimizing men’s salon/shop layout.",
      location: "Illinois",
      status: "on-boarding",
    },
    {
      title: "Home builder",
      techStack: ["Real Estate Listings", "Operations Enhancement", "AI Optimization"],
      description:
        "Consultation on real estate listings, operational enhancements, and AI integration for future projects.",
      location: "Illinois",
      status: "on-boarding",
    },
    {
      title: "Landscaping company",
      techStack: ["AI Optimization", "TBD"],
      description: "AI optimizations to assist with client landscaping projects.",
      location: "Illinois",
      status: "complete",
    },
    {
      title: "Restaurant and bar",
      techStack: ["Preventive Maintenance", "Specialty Repairs", "Restaurant & Bar"],
      description:
        "Evaluating restaurant and bar space for a preventive maintenance program and specialty repairs.",
      location: "New York, NY",
      status: "complete",
    },
  ],
};
