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
  const totalPersonDays = rows.reduce((sum, row) => {
    const locationDays = (row.locations ?? []).reduce(
      (locationSum, location) => locationSum + Math.max(0, Math.trunc(Number(location.days) || 0)),
      0,
    );
    // Preserve older records that have a row-level duration but no usable location breakdown.
    const rowDays = locationDays > 0 || (row.locations?.length ?? 0) === 0
      ? locationDays
      : Math.max(0, Math.trunc(Number(row.days) || 0));
    return sum + rowDays;
  }, 0);
  return {
    totalDays: totalPersonDays,
    totalPersonDays,
  };
}
