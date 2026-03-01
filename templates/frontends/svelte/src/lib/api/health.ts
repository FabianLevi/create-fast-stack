import { apiRequest } from './client';

export interface HealthResponse {
  status: string;
}

export function fetchHealth() {
  return apiRequest<HealthResponse>('/health');
}
