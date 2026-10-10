export type MissionStatus = "pending" | "approved" | "rejected";

export interface MissionLocation {
  name: string;
  days: number;
}

export interface MissionRow {
  id: number;
  personName: string;
  days: number;
  locations: MissionLocation[];
  activity: string;
  tag?: string;
}

export interface MissionReport {
  version: 1;
  documentNumber: string;
  issuedAt: string;
  status: MissionStatus;
  month: string;
  rows: MissionRow[];
}

export interface MissionTotals {
  totalDays: number;
  totalPersonDays: number;
}

export function calculateMissionTotals(rows: MissionRow[]): MissionTotals {
  // Location entries are the source of truth: each person's days are the sum
  // of the days entered for their individual mission locations.
  const totalPersonDays = rows.reduce(
    (sum, row) =>
      sum +
      (Array.isArray(row.locations)
        ? row.locations.reduce((locationSum, location) => locationSum + Math.max(0, Math.trunc(location.days || 0)), 0)
        : Math.max(0, Math.trunc(row.days || 0))),
    0,
  );
  return {
    totalDays: totalPersonDays,
    totalPersonDays,
  };
}
