"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api";

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number;
  status: string;
  branchId: string;
  insuranceExpiry: string | null;
  roadworthyExpiry: string | null;
  nextServiceDate: string | null;
  trips: VehicleTrip[];
}

export interface VehicleTrip {
  id: string;
  driverName: string;
  purpose: string;
  startAt: string;
  startMileage: number;
}

export interface CreateVehicleInput {
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  mileage: number;
  branchId: string;
  insuranceExpiry?: string;
  roadworthyExpiry?: string;
  nextServiceDate?: string;
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => apiRequest<Vehicle[]>("vehicles"),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicle: CreateVehicleInput) =>
      apiRequest<Vehicle>("vehicles", { method: "POST", body: vehicle }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
