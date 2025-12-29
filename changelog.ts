export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const APP_VERSION = "1.0.0";

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2024-05-22",
    changes: [
      "Initial React Migration",
      "Town Management System",
      "Asset Library & Label Filtering",
      "Admin Toolbar Implementation"
    ]
  },
  {
    version: "0.9.0",
    date: "2024-05-15",
    changes: [
      "Legacy Javascript Prototype",
      "Basic Isometric Grid",
      "Static Asset Loading"
    ]
  }
];