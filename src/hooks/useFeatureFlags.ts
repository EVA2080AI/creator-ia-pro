import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  // Core features
  darkMode: boolean;
  studioV2: boolean;
  canvasV2: boolean;

  // AI features
  videoGeneration: boolean;
  imageEnhancement: boolean;
  codeAssistant: boolean;
  multiModelChat: boolean;

  // Billing features
  newPricingPlans: boolean;
  teamBilling: boolean;
  usageAnalytics: boolean;

  // Experimental
  betaFeatures: boolean;
  earlyAccess: boolean;

  // Admin
  adminV2: boolean;
  advancedAnalytics: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  darkMode: true,
  studioV2: false,
  canvasV2: false,
  videoGeneration: true,
  imageEnhancement: true,
  codeAssistant: true,
  multiModelChat: true,
  newPricingPlans: false,
  teamBilling: false,
  usageAnalytics: true,
  betaFeatures: false,
  earlyAccess: false,
  adminV2: false,
  advancedAnalytics: false,
};

export function useFeatureFlags(userId?: string) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlags() {
      if (!userId) {
        // Check localStorage for cached flags
        const cached = localStorage.getItem('feature_flags');
        if (cached) {
          try {
            setFlags({ ...DEFAULT_FLAGS, ...JSON.parse(cached) });
          } catch {
            setFlags(DEFAULT_FLAGS);
          }
        }
        setLoading(false);
        return;
      }

      try {
        // Fetch user-specific feature flags from Supabase
        const { data, error } = await supabase
          .from('user_feature_flags')
          .select('flags')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        if (data?.flags) {
          const mergedFlags = { ...DEFAULT_FLAGS, ...data.flags };
          setFlags(mergedFlags);
          localStorage.setItem('feature_flags', JSON.stringify(data.flags));
        }
      } catch (err) {
        console.error('Failed to fetch feature flags:', err);
        setError('Failed to load feature flags');

        // Fall back to cached or default
        const cached = localStorage.getItem('feature_flags');
        if (cached) {
          try {
            setFlags({ ...DEFAULT_FLAGS, ...JSON.parse(cached) });
          } catch {
            setFlags(DEFAULT_FLAGS);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFlags();
  }, [userId]);

  const toggleFlag = async (flag: keyof FeatureFlags) => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    setFlags(newFlags);

    // Cache locally
    localStorage.setItem('feature_flags', JSON.stringify(newFlags));

    // If user is logged in, sync to server
    if (userId) {
      try {
        await supabase
          .from('user_feature_flags')
          .upsert({
            user_id: userId,
            flags: newFlags,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Failed to sync feature flag:', err);
      }
    }
  };

  const enableFlag = async (flag: keyof FeatureFlags) => {
    if (!flags[flag]) {
      await toggleFlag(flag);
    }
  };

  const disableFlag = async (flag: keyof FeatureFlags) => {
    if (flags[flag]) {
      await toggleFlag(flag);
    }
  };

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags[flag] ?? DEFAULT_FLAGS[flag];
  };

  return {
    flags,
    loading,
    error,
    toggleFlag,
    enableFlag,
    disableFlag,
    isEnabled,
  };
}

// Hook for feature-specific access control
export function useFeatureAccess(feature: keyof FeatureFlags) {
  const { isEnabled, loading } = useFeatureFlags();

  return {
    hasAccess: isEnabled(feature),
    loading,
  };
}
