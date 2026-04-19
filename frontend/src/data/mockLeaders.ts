export type StatAccent = "green" | "amber" | "rose" | "purple";

export interface LeaderStat {
  id: string;
  icon: "leaf" | "wallet" | "flame" | "gauge";
  bigValue: string;
  label: string;
  subtext: string;
  badgeText: string;
  badgeTone: "positive" | "neutral" | "warning";
  accent: StatAccent;
}

export interface LeaderAchievement {
  id: string;
  icon: "crown" | "flame" | "target" | "sparkles";
  title: string;
}

export interface LeaderTeam {
  id: string;
  name: string;
  subtitle: string;
  membersLabel: string;
  leaderLine: string;
  rankBadge: string;
  progressAccent: "green" | "blue" | "violet";
  avatarInitials: string[];
}

export interface LeaderRecommendation {
  id: string;
  title: string;
  subtitle: string;
  membersLabel: string;
  pillText: string;
  accentLine: string;
}

export const LEADER_STATS: LeaderStat[] = [
  {
    id: "nutrition",
    icon: "leaf",
    bigValue: "76 pts",
    label: "Nutrition Score",
    subtext: "#4 in Budget Warriors",
    badgeText: "+3",
    badgeTone: "positive",
    accent: "green",
  },
  {
    id: "spend",
    icon: "wallet",
    bigValue: "$24",
    label: "Weekly Spend",
    subtext: "Under $30 goal",
    badgeText: "On track",
    badgeTone: "neutral",
    accent: "amber",
  },
  {
    id: "streak",
    icon: "flame",
    bigValue: "5",
    label: "Day Streak",
    subtext: "days logged",
    badgeText: "Best yet",
    badgeTone: "warning",
    accent: "rose",
  },
  {
    id: "efficiency",
    icon: "gauge",
    bigValue: "89%",
    label: "Efficiency",
    subtext: "nutrient per $",
    badgeText: "Top 15%",
    badgeTone: "positive",
    accent: "purple",
  },
];

export const LEADER_ACHIEVEMENTS: LeaderAchievement[] = [
  { id: "budget-king", icon: "crown", title: "Budget King" },
  { id: "streak-5", icon: "flame", title: "5 Day Streak" },
  { id: "macro-master", icon: "target", title: "Macro Master" },
  { id: "wiz-20", icon: "sparkles", title: "$20 Wiz" },
];

export const LEADER_TEAMS: LeaderTeam[] = [
  {
    id: "budget-warriors",
    name: "Budget Warriors",
    subtitle: "Best Nutrition Under $30",
    membersLabel: "128 members",
    leaderLine: "Maya leads · 94 pts",
    rankBadge: "You #4",
    progressAccent: "green",
    avatarInitials: ["M", "J", "S", "+"],
  },
  {
    id: "student-savers",
    name: "Student Savers",
    subtitle: "Most Efficient on $20",
    membersLabel: "64 members",
    leaderLine: "Kai leads · 90 pts",
    rankBadge: "You #7",
    progressAccent: "blue",
    avatarInitials: ["K", "L", "R"],
  },
  {
    id: "clean-eaters",
    name: "Clean Eaters",
    subtitle: "Hit 80%+ Micronutrients",
    membersLabel: "203 members",
    leaderLine: "Zoe leads · 97 pts",
    rankBadge: "You #12",
    progressAccent: "violet",
    avatarInitials: ["Z", "A", "T", "+"],
  },
];

export const LEADER_RECOMMENDATIONS: LeaderRecommendation[] = [
  {
    id: "meal-preppers",
    title: "Meal Preppers",
    subtitle: "Weekly prep champions",
    membersLabel: "312 members",
    pillText: "Similar budget",
    accentLine: "#4ADE80",
  },
  {
    id: "protein-packers",
    title: "Protein Packers",
    subtitle: "Hit daily protein goals",
    membersLabel: "87 members",
    pillText: "Near your score",
    accentLine: "#38BDF8",
  },
];
