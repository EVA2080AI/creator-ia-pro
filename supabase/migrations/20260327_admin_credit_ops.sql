-- ─── Admin Credit Operations ──────────────────────────────────────────────────
-- New functions for granular credit management from the Admin panel

-- 1. Add credits to a user (increment, not replace)
CREATE OR REPLACE FUNCTION admin_add_credits(
  _target_user_id UUID,
  _amount         INTEGER,
  _reason         TEXT DEFAULT 'Admin credit grant'
)
RETURNS INTEGER AS $$
DECLARE
  _new_balance INTEGER;
BEGIN
  -- Allow if calling user is an admin OR if the caller is the service_role (e.g. from an Edge Function)
  IF NOT has_role(auth.uid(), 'admin') AND (SELECT current_setting('role')) <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE profiles
  SET credits_balance = credits_balance + _amount
  WHERE user_id = _target_user_id
  RETURNING credits_balance INTO _new_balance;

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (_target_user_id, 'admin_grant', _amount, _reason);

  RETURN _new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Deduct credits from a user (clamped at 0)
CREATE OR REPLACE FUNCTION admin_deduct_credits(
  _target_user_id UUID,
  _amount         INTEGER,
  _reason         TEXT DEFAULT 'Admin credit deduction'
)
RETURNS INTEGER AS $$
DECLARE
  _new_balance INTEGER;
BEGIN
  -- Allow if calling user is an admin OR if the caller is the service_role
  IF NOT has_role(auth.uid(), 'admin') AND (SELECT current_setting('role')) <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE profiles
  SET credits_balance = GREATEST(0, credits_balance - _amount)
  WHERE user_id = _target_user_id
  RETURNING credits_balance INTO _new_balance;

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (_target_user_id, 'admin_deduct', -_amount, _reason);

  RETURN _new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Admin refund (explicit refund with reason)
CREATE OR REPLACE FUNCTION admin_refund_credits(
  _target_user_id UUID,
  _amount         INTEGER,
  _reason         TEXT DEFAULT 'Admin refund'
)
RETURNS INTEGER AS $$
DECLARE
  _new_balance INTEGER;
BEGIN
  -- Allow if calling user is an admin OR if the caller is the service_role
  IF NOT has_role(auth.uid(), 'admin') AND (SELECT current_setting('role')) <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE profiles
  SET credits_balance = credits_balance + _amount
  WHERE user_id = _target_user_id
  RETURNING credits_balance INTO _new_balance;

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (_target_user_id, 'refund', _amount, _reason);

  RETURN _new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get transaction history for a user (admin only)
CREATE OR REPLACE FUNCTION admin_get_transactions(
  _target_user_id UUID,
  _limit          INTEGER DEFAULT 25
)
RETURNS TABLE (
  id          UUID,
  type        TEXT,
  amount      INTEGER,
  description TEXT,
  created_at  TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT t.id, t.type::TEXT, t.amount, t.description, t.created_at
  FROM transactions t
  WHERE t.user_id = _target_user_id
  ORDER BY t.created_at DESC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update admin_list_users to include is_active (if column exists, else NULL)
-- NOTE: This replaces the existing function to add better data
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id           UUID,
  email             TEXT,
  display_name      TEXT,
  credits_balance   INTEGER,
  subscription_tier TEXT,
  created_at        TIMESTAMPTZ,
  last_sign_in      TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email::TEXT,
    p.display_name::TEXT,
    p.credits_balance,
    p.subscription_tier::TEXT,
    p.created_at,
    au.last_sign_in_at AS last_sign_in
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
