import React from "react";
import { BookOpen, ExternalLink, Video, Code } from "lucide-react";

interface Resource {
  title: string;
  type: "book" | "video" | "practice";
  url: string;
  description: string;
}

interface ResourceRecommendationsProps {
  priorityTopics: string[];
}

export function ResourceRecommendations({ priorityTopics }: ResourceRecommendationsProps) {
  // Static dictionary matching common placement topics to curated resources
  const resourceRegistry: Record<string, Resource[]> = {
    "Operating Systems": [
      {
        title: "Operating System Concepts by Galvin",
        type: "book",
        url: "https://www.google.com/search?q=Operating+System+Concepts+Galvin",
        description: "The gold standard for understanding memory management, CPU scheduling, and process synchronization."
      },
      {
        title: "Gate Smashers Operating Systems Course",
        type: "video",
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
        description: "Concise, highly placement-oriented lectures breaking down complex OS theorems."
      }
    ],
    "Computer Networks": [
      {
        title: "Computer Networking: A Top-Down Approach",
        type: "book",
        url: "https://www.google.com/search?q=Computer+Networking+Top+Down+Approach",
        description: "Comprehensive guide focusing on application layer down to link layer."
      },
      {
        title: "Gate Smashers Computer Networks Playlist",
        type: "video",
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBDt5IpzOfXO9a2w_8cDE",
        description: "Clear visual explanations of TCP/IP layers, routing protocol math, and DNS."
      }
    ],
    "System Design": [
      {
        title: "Designing Data-Intensive Applications",
        type: "book",
        url: "https://www.google.com/search?q=Designing+Data+Intensive+Applications+Martin+Kleppmann",
        description: "Crucial reading for scaling distributed systems, storage engines, and caching topologies."
      },
      {
        title: "The System Design Primer (GitHub)",
        type: "practice",
        url: "https://github.com/donnemartin/system-design-primer",
        description: "An open-source collection of study guides, sample interview answers, and architectural diagrams."
      }
    ],
    "Data Structures & Algorithms": [
      {
        title: "NeetCode.io Practice Roadmap",
        type: "practice",
        url: "https://neetcode.io",
        description: "A structured checklist of standard DSA patterns sorted by difficulty with video walk-throughs."
      },
      {
        title: "LeetCode Top Interview 150",
        type: "practice",
        url: "https://leetcode.com/studyplan/top-interview-150/",
        description: "The most commonly asked technical coding interview challenges for core data structures."
      }
    ],
    "Databases": [
      {
        title: "SQLZoo Interactive Tutorial",
        type: "practice",
        url: "https://sqlzoo.net/",
        description: "Interactive browser terminal to practice complex SQL queries, JOIN operations, and groupings."
      },
      {
        title: "Database Management Systems (DBMS) - Gate Smashers",
        type: "video",
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGGtV1jiXX_RTgvF_7R9IRs",
        description: "Visual walkthroughs of normalization, SQL transactions, ACID properties, and B-trees."
      }
    ]
  };

  // Compile matching resources based on priority topics, or load general ones if no matches
  const compiledResources: Resource[] = [];
  const matchedTopics = priorityTopics.filter(t => resourceRegistry[t]);

  if (matchedTopics.length > 0) {
    matchedTopics.slice(0, 3).forEach(t => {
      compiledResources.push(...resourceRegistry[t]);
    });
  } else {
    // General Placement defaults
    compiledResources.push(
      {
        title: "LeetCode Top Interview 150 Plan",
        type: "practice",
        url: "https://leetcode.com/studyplan/top-interview-150/",
        description: "The core list of standard algorithmic questions covering arrays, pointers, strings, and trees."
      },
      {
        title: "The System Design Primer (GitHub)",
        type: "practice",
        url: "https://github.com/donnemartin/system-design-primer",
        description: "Open-source reference blueprints explaining load balancing, database scaling, CDN, and sharding."
      },
      {
        title: "Gate Smashers Technical Subjects Course",
        type: "video",
        url: "https://www.youtube.com/@GateSmashers",
        description: "The leading Hindi-English video library for core CS subjects (OS, DBMS, Networks, Compiler Design)."
      }
    );
  }

  const getIcon = (type: string) => {
    if (type === "video") return <Video className="h-4 w-4 text-purple-400" />;
    if (type === "practice") return <Code className="h-4 w-4 text-emerald-400" />;
    return <BookOpen className="h-4 w-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
          Curated Study Resources
        </h3>
        <p className="text-xs text-white/40 mt-1">
          High-yield preparation guides, books, and courses selected to support your priority topics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {compiledResources.map((res, i) => (
          <a
            key={i}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-2 flex flex-col justify-between hover:border-white/15 hover:bg-white/[0.07] transition group cursor-pointer text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white/5 p-2 border border-white/5 shrink-0">
                  {getIcon(res.type)}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60 transition" />
              </div>
              <h4 className="text-xs font-bold text-white leading-snug group-hover:text-white transition pt-1">
                {res.title}
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed">
                {res.description}
              </p>
            </div>
            <div className="pt-2 text-[10px] font-semibold font-mono text-white/30 uppercase tracking-wide">
              {res.type}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
