"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface IntegrationSetting {
  id?: string;
  provider: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export function useIntegration(provider: string) {
  return useQuery({
    queryKey: ["admin-integration", provider],
    queryFn: async () => {
      const res = await fetch(`/api/admin/integrations?provider=${provider}`);
      if (!res.ok) throw new Error("Erro ao buscar integração");
      return res.json() as Promise<IntegrationSetting>;
    },
  });
}

export function useAllIntegrations() {
  return useQuery({
    queryKey: ["admin-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/integrations");
      if (!res.ok) throw new Error("Erro ao buscar integrações");
      return res.json() as Promise<IntegrationSetting[]>;
    },
  });
}

export function useSaveIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: string; enabled: boolean; config: Record<string, any> }) => {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-integration", vars.provider] });
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
    },
  });
}
