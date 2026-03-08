
-- 1. Create trigger for handle_new_user (missing - critical for new signups)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Standardize tier names: rename "education" to "educacion" in existing data
UPDATE public.profiles SET subscription_tier = 'educacion' WHERE subscription_tier = 'education';
