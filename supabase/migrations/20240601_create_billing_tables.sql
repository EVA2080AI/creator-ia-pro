/* 20240601_create_billing_tables.sql */

-- Credits table
CREATE TABLE IF NOT EXISTS public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  balance bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_id text NOT NULL,               -- Stripe price ID
  credits_amount bigint NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  stripe_invoice_id text NOT NULL,
  amount bigint NOT NULL,
  credits_awarded bigint NOT NULL,
  status text NOT NULL,                 -- paid / pending / failed
  created_at timestamp with time zone DEFAULT now()
);

-- Transactions table (add/deduct/refund)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL,                   -- add | deduct | refund
  amount bigint NOT NULL,
  reference text,                       -- e.g., stripe charge ID
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security policies
-- Users can read/write their own credits
CREATE POLICY "allow_user_credits" ON public.credits
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can manage all credits
CREATE POLICY "admin_manage_credits" ON public.credits
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'));

-- Admin can read/write plans, invoices, transactions
CREATE POLICY "admin_all" ON public.plans FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'));
CREATE POLICY "admin_all" ON public.invoices FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'));
CREATE POLICY "admin_all" ON public.transactions FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'));

-- Enable RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RPC functions for credit manipulation
CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _amount bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.credits SET balance = balance - _amount
  WHERE user_id = _user_id AND balance >= _amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_credits(_user_id uuid, _amount bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.credits SET balance = balance + _amount WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deduct_credits(_user_id uuid, _amount bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.credits SET balance = balance - _amount WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_refund_credits(_user_id uuid, _amount bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.credits SET balance = balance + _amount WHERE user_id = _user_id;
END;
$$;
