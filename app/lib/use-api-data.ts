"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api";

export function useApiList<T>(key: string, path: string, enabled = true) {
  return useQuery({
    queryKey: [key],
    queryFn: () => apiRequest<T[]>(path),
    enabled,
  });
}

export function useApiMutation<TInput, TOutput>(
  key: string,
  path: string | ((input: TInput) => string),
  method: "POST" | "PATCH",
  mapBody: (input: TInput) => unknown = (input) => input,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => {
      const body = mapBody(input);
      return apiRequest<TOutput>(
        typeof path === "function" ? path(input) : path,
        { method, ...(body === undefined ? {} : { body }) },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
