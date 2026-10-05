export interface Project {
  id: number;
  title: string;
  province: string;
  community: string;
  budget: string;
  status: 'On Track' | 'Completed' | 'At Risk';
  progress: number;
  category: string;
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Galeshewe Stormwater Drainage Upgrade",
    province: "Northern Cape",
    community: "Kimberley",
    budget: "R 110M",
    status: "On Track",
    progress: 75,
    category: "Infrastructure"
  },
  {
    id: 2,
    title: "Upington Solar Farm Grid Extension",
    province: "Northern Cape",
    community: "Upington",
    budget: "R 200M",
    status: "Completed",
    progress: 100,
    category: "Energy"
  },
  {
    id: 3,
    title: "Soweto Schools Renovation Programme",
    province: "Gauteng",
    community: "Soweto",
    budget: "R 45M",
    status: "Completed",
    progress: 100,
    category: "Education"
  },
  {
    id: 4,
    title: "Mamelodi Community Clinic Construction",
    province: "Gauteng",
    community: "Mamelodi",
    budget: "R 85M",
    status: "At Risk",
    progress: 38,
    category: "Healthcare"
  },
  {
    id: 5,
    title: "Khayelitsha Youth Sports Complex",
    province: "Western Cape",
    community: "Khayelitsha",
    budget: "R 120M",
    status: "On Track",
    progress: 80,
    category: "Community"
  }
];