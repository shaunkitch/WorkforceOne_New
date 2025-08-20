-- =============================================
-- STRIPE INTEGRATION UPDATES
-- =============================================

-- Add Stripe customer ID to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Add payment method tracking to subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255);

-- Add trial extension tracking
ALTER TABLE public.subscriptions
ALTER COLUMN metadata SET DEFAULT '{"extension_used": false}'::jsonb;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer 
ON public.organizations(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_payment_method 
ON public.subscriptions(stripe_payment_method_id);

-- Function to handle trial extension
CREATE OR REPLACE FUNCTION extend_trial(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
  extension_used BOOLEAN := false;
  current_trial_end TIMESTAMPTZ;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can extend trials';
  END IF;

  -- Get subscription and check if extension already used
  SELECT id, trial_ends_at, COALESCE(metadata->>'extension_used', 'false')::boolean
  INTO sub_id, current_trial_end, extension_used
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_id IS NULL THEN
    RAISE EXCEPTION 'No subscription found for organization';
  END IF;

  IF extension_used THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Trial extension already used'
    );
  END IF;

  -- Extend trial by 10 days and mark extension as used
  UPDATE subscriptions
  SET 
    trial_ends_at = current_trial_end + INTERVAL '10 days',
    metadata = metadata || '{"extension_used": true}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_trial_end', current_trial_end + INTERVAL '10 days',
    'message', 'Trial extended by 10 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check trial status
CREATE OR REPLACE FUNCTION get_trial_status(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  sub_record RECORD;
  days_remaining INTEGER;
  result JSONB;
BEGIN
  SELECT 
    status,
    trial_ends_at,
    COALESCE(metadata->>'extension_used', 'false')::boolean as extension_used,
    EXTRACT(DAY FROM trial_ends_at - CURRENT_TIMESTAMP)::integer as days_left
  INTO sub_record
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_record IS NULL THEN
    RETURN jsonb_build_object(
      'has_subscription', false,
      'is_trial', false
    );
  END IF;

  days_remaining := GREATEST(0, sub_record.days_left);

  RETURN jsonb_build_object(
    'has_subscription', true,
    'is_trial', sub_record.status = 'trial',
    'days_remaining', days_remaining,
    'trial_ends_at', sub_record.trial_ends_at,
    'extension_used', sub_record.extension_used,
    'is_expired', sub_record.trial_ends_at < CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION extend_trial TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_status TO authenticated;

-- Comments
COMMENT ON FUNCTION extend_trial IS 'Extend trial period by 10 days (one-time only)';
COMMENT ON FUNCTION get_trial_status IS 'Get detailed trial status for an organization';

-- Update existing subscriptions to have proper metadata
UPDATE public.subscriptions 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"extension_used": false}'::jsonb
WHERE metadata IS NULL OR NOT metadata ? 'extension_used';