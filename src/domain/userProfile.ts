import type { AgentSessionState } from "./agentTypes";

export type UserProfile = {
  favoriteCocktailIds: string[];
  recentCocktailIds: string[];
  barIngredientIds: string[];
  agentSession: AgentSessionState;
};

const STORAGE_KEY = "cocktail-user-profile-v1";

export const emptyAgentSession: AgentSessionState = {
  preferredFlavors: [],
  dislikedFlavors: [],
  availableIngredients: [],
  lastRecommendationIds: [],
  rejectedRecommendationIds: []
};

export const defaultUserProfile: UserProfile = {
  favoriteCocktailIds: [],
  recentCocktailIds: [],
  barIngredientIds: [],
  agentSession: emptyAgentSession
};

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return defaultUserProfile;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<UserProfile>;
    return {
      favoriteCocktailIds: saved.favoriteCocktailIds ?? [],
      recentCocktailIds: saved.recentCocktailIds ?? [],
      barIngredientIds: saved.barIngredientIds ?? [],
      agentSession: { ...emptyAgentSession, ...(saved.agentSession ?? {}) }
    };
  } catch {
    return defaultUserProfile;
  }
}

export function saveUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function addRecentCocktail(profile: UserProfile, cocktailId: string): UserProfile {
  return {
    ...profile,
    recentCocktailIds: [cocktailId, ...profile.recentCocktailIds.filter((id) => id !== cocktailId)].slice(0, 12)
  };
}

export function toggleFavoriteCocktail(profile: UserProfile, cocktailId: string): UserProfile {
  const isFavorite = profile.favoriteCocktailIds.includes(cocktailId);
  return {
    ...profile,
    favoriteCocktailIds: isFavorite
      ? profile.favoriteCocktailIds.filter((id) => id !== cocktailId)
      : [cocktailId, ...profile.favoriteCocktailIds]
  };
}

