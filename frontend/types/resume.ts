export type ResumeSection = {
  title: string;
  items: string[];
};

export type ResumeAnalysis = {
  candidateName: string;
  role: string;
  skills: string[];
  projects: ResumeSection;
  education: ResumeSection;
  experience: ResumeSection;
  achievements: ResumeSection;
  strengths: string[];
  weaknesses: string[];
  readinessScore: number;
};
