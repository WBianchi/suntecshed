import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────
export interface HallOfFameEntry {
  id: string;
  clientName: string;
  title: string;
  salesValue: number;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string | null;
  clientPhoto: string | null;
  trophyPhoto: string | null;
  achievementDate: string | null;
  category: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HallOfFameFormData {
  clientName: string;
  title: string;
  salesValue: number;
  description?: string | null;
  youtubeUrl: string;
  clientPhoto?: string | null;
  trophyPhoto?: string | null;
  achievementDate?: string | null;
  category?: string;
  displayOrder?: number;
  active?: boolean;
  featured?: boolean;
}

// ── Hook: Listar registros (admin) ─────────────────────
export function useAdminHallOfFame(search: string, category: string, status: string) {
  return useQuery<HallOfFameEntry[]>({
    queryKey: ["admin-hall-of-fame", search, category, status],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/hall-of-fame?${p}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar registros");
      return res.json();
    },
  });
}

// ── Hook: Criar registro ───────────────────────────────
export function useCreateHallOfFame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: HallOfFameFormData) => {
      const res = await fetch("/api/admin/hall-of-fame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hall-of-fame"] }),
  });
}

// ── Hook: Atualizar registro ───────────────────────────
export function useUpdateHallOfFame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HallOfFameFormData> }) => {
      const res = await fetch(`/api/admin/hall-of-fame/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hall-of-fame"] }),
  });
}

// ── Hook: Excluir registro ─────────────────────────────
export function useDeleteHallOfFame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/hall-of-fame/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hall-of-fame"] }),
  });
}
