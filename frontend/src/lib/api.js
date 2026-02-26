import axios from "axios";
import { store } from "../store/index.js";

import { setTokens, clearAuth } from "../store/authSlice.js";

const api = axios.create({

  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000)
});

api.interceptors.request.use((config) => {
  const { accessToken } = store.getState().auth;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;


  }

  return config;

});

let isRefreshing = false;
let pending = [];
const MAX_RETRY_ATTEMPTS = Number(import.meta.env.VITE_API_RETRY_MAX_ATTEMPTS || 2);
const RETRY_BASE_DELAY_MS = Number(import.meta.env.VITE_API_RETRY_BASE_DELAY_MS || 300);
const RETRYABLE_METHODS = new Set(["get", "head", "options"]);

const isRefreshRequest = (config) => {
  const url = config?.url || "";
  return typeof url === "string" && url.includes("/auth/refresh");
};

const resetAuthSession = () => {
  store.dispatch(clearAuth());
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.replace("/?auth=login");
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryRequest = (error, config) => {
  const method = String(config?.method || "get").toLowerCase();
  const allowRetry = RETRYABLE_METHODS.has(method) || config?.retryable === true;
  if (!allowRetry) return false;
  if (isRefreshRequest(config)) return false;

  const status = error?.response?.status;
  const networkError = !error?.response || error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED";
  const transientHttp = status === 429 || status >= 500;
  return networkError || transientHttp;
};


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    if (!original) return Promise.reject(error);

    const currentAttempt = Number(original._networkRetryCount || 0);
    if (currentAttempt < MAX_RETRY_ATTEMPTS && shouldRetryRequest(error, original)) {
      original._networkRetryCount = currentAttempt + 1;
      const jitter = Math.floor(Math.random() * 120);
      const delayMs = RETRY_BASE_DELAY_MS * (2 ** currentAttempt) + jitter;
      await sleep(delayMs);
      return api(original);
    }

    if (error.response?.status === 401 && !original._retry && !isRefreshRequest(original)) {
      original._retry = true;
      const { refreshToken } = store.getState().auth;
      if (!refreshToken) {
        resetAuthSession();
        return Promise.reject(error);

      }

























      if (isRefreshing) {












        return new Promise((resolve, reject) => {












          pending.push({ resolve, reject });












        }).then((token) => {












          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);












        });












      }

























      isRefreshing = true;












      try {












        const res = await api.post("/auth/refresh", { refresh_token: refreshToken });












        store.dispatch(setTokens(res.data));












        pending.forEach((p) => p.resolve(res.data.access_token));












        pending = [];












        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(original);












      } catch (err) {












        pending.forEach((p) => p.reject(err));












        pending = [];












        resetAuthSession();
        return Promise.reject(err);












      } finally {












        isRefreshing = false;












      }












    }












    if (error.response?.status === 401 && isRefreshRequest(original)) {
      resetAuthSession();
    }
    return Promise.reject(error);
  }












);

























export default api;













