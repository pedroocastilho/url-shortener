// src/services/api.ts
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShortUrl, CreateUrlPayload, Analytics } from '../types/index.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Query Keys ───────────────────────────────────────────────────────────
export const queryKeys = {
  urls: ['urls'] as const,
  url: (id: string) => ['urls', id] as const,
  analytics: (id: string) => ['urls', id, 'analytics'] as const,
};

// ─── API Functions ────────────────────────────────────────────────────────
async function fetchUrls(): Promise<ShortUrl[]> {
  const { data } = await api.get<ShortUrl[]>('/api/urls');
  return data;
}

async function fetchUrl(id: string): Promise<ShortUrl> {
  const { data } = await api.get<ShortUrl>(`/api/urls/${id}`);
  return data;
}

async function fetchAnalytics(id: string): Promise<Analytics> {
  const { data } = await api.get<Analytics>(`/api/urls/${id}/analytics`);
  return data;
}

async function createUrl(payload: CreateUrlPayload): Promise<ShortUrl> {
  const { data } = await api.post<ShortUrl>('/api/urls', payload);
  return data;
}

async function deleteUrl(id: string): Promise<void> {
  await api.delete(`/api/urls/${id}`);
}

// ─── React Query Hooks ────────────────────────────────────────────────────
export function useUrls() {
  return useQuery({
    queryKey: queryKeys.urls,
    queryFn: fetchUrls,
  });
}

export function useUrl(id: string) {
  return useQuery({
    queryKey: queryKeys.url(id),
    queryFn: () => fetchUrl(id),
    enabled: !!id,
  });
}

export function useAnalytics(id: string) {
  return useQuery({
    queryKey: queryKeys.analytics(id),
    queryFn: () => fetchAnalytics(id),
    enabled: !!id,
    refetchInterval: 30_000, // Auto-refresh analytics every 30 seconds
  });
}

export function useCreateUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.urls });
    },
  });
}

export function useDeleteUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.urls });
    },
  });
}
