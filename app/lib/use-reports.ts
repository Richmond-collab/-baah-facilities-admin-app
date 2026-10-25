"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./api";

export interface MonthlyReportValue {
  month: string;
  value: number;
}

export interface OperationsReport {
  rangeStart: string;
  vehicleMaintenanceCosts: MonthlyReportValue[];
  tripsPerMonth: MonthlyReportValue[];
  maintenanceBacklog: Array<{ status: string; count: number }>;
  packageDeliveryTimesHours: MonthlyReportValue[];
  visitorCounts: MonthlyReportValue[];
}

export function useOperationsReport(enabled = true) {
  return useQuery({
    queryKey: ["reports", "operations"],
    queryFn: () => apiRequest<OperationsReport>("reports/operations"),
    enabled,
  });
}
