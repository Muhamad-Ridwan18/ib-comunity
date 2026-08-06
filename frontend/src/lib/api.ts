import axios from "axios";
import { API_URL } from "@/constants";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  // Force same-origin proxy path even if a bad absolute base sneaks in
  if (typeof window !== "undefined") {
    const base = String(config.baseURL || "");
    if (!base || /^https?:\/\/(localhost|127\.0\.0\.1):300\d/i.test(base)) {
      config.baseURL = "/v1";
    }
    const token = localStorage.getItem("ib_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Keep callers able to catch; avoid noisy Next overlay for expected auth misses
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const hasToken = Boolean(localStorage.getItem("ib_access_token"));
      if (!hasToken) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);