export const APP_NAME = "StartupConnect";

export enum UserRole {
  Founder = "Startup Founder",
  AngelInvestor = "Angel Investor",
  VC = "Venture Capitalist",
  IndustryExpert = "Industry Expert",
}

export const USER_ROLES = Object.values(UserRole);

export const INDUSTRIES = [
  "B2B SaaS",
  "EdTech",
  "Climate Tech",
  "FinTech",
  "HealthTech",
  "Consumer Goods",
  "AI/ML",
  "Blockchain",
  "E-commerce",
  "Gaming",
];

export const FUNDING_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Bootstrapped",
  "Growth Stage",
];

export const EXPERTISE_AREAS = [
  "Product Development",
  "Marketing & Sales",
  "Fundraising",
  "Technology",
  "Operations",
  "Legal",
  "Finance",
  "HR & Talent",
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
];
