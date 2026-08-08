const DEFAULT_API_BASE = "https://cocktail-yzv9.onrender.com";

export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_API_BASE;
