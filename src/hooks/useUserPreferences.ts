import { useState, useEffect, useCallback } from 'react';

interface UserPreferences {
  // UI
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;

  // Editor
  codeEditorTheme: 'vs-dark' | 'vs-light' | 'hc-black';
  wordWrap: boolean;
  minimap: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;

  // AI
  defaultModel: string;
  autoSave: boolean;
  autoComplete: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  sidebarCollapsed: false,
  theme: 'system',
  fontSize: 'medium',
  reducedMotion: false,
  codeEditorTheme: 'vs-dark',
  wordWrap: true,
  minimap: true,
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  defaultModel: 'anthropic/claude-sonnet-4',
  autoSave: true,
  autoComplete: true,
};

const STORAGE_KEY = 'creator-ia-preferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isLoaded]);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    isLoaded,
  };
}

// Hook for theme management
export function useTheme() {
  const { preferences, updatePreference } = useUserPreferences();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (preferences.theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(preferences.theme);
      }
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  const setTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      updatePreference('theme', theme);
    },
    [updatePreference]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    updatePreference('theme', newTheme);
  }, [resolvedTheme, updatePreference]);

  return {
    theme: preferences.theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const { preferences } = useUserPreferences();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches || preferences.reducedMotion);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches || preferences.reducedMotion);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preferences.reducedMotion]);

  return prefersReducedMotion;
}
