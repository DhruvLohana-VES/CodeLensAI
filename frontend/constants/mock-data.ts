import type { ResumeAnalysis } from "@/types/resume";

export const mockResumeAnalysis: ResumeAnalysis = {
  candidateName: "Aarav Mehta",
  role: "Software Engineer Intern",
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "System Design",
    "Data Structures",
  ],
  projects: {
    title: "Projects",
    items: [
      "SkillScope: AI-powered resume parser with semantic tagging",
      "CampusHire: placement tracker with analytics dashboards",
      "CodeJournal: markdown-first developer portfolio builder",
    ],
  },
  education: {
    title: "Education",
    items: [
      "B.Tech in Computer Science, VIT (2022-2026)",
      "Coursework: Algorithms, DBMS, Operating Systems, ML Basics",
    ],
  },
  experience: {
    title: "Experience",
    items: [
      "Software Engineering Intern – ABC",
      "ML Intern – XYZ",
    ],
  },
  achievements: {
    title: "Achievements",
    items: [
      "Top 5% in national hackathon for product design",
      "Led a 4-member team for placement readiness workshop",
      "Open-source contributor with 150+ GitHub stars",
    ],
  },
  strengths: [
    "Strong front-end system design mindset",
    "Clear ownership and product thinking",
    "Solid grasp of algorithms and coding interviews",
  ],
  weaknesses: [
    "Limited production-scale backend exposure",
    "Needs more depth in distributed systems",
    "Project testing coverage can improve",
  ],
  readinessScore: 78,
};
