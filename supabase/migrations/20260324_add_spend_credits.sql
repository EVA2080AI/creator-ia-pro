-- Function to spend credits securely from the frontend
-- This avoids exposing the service_role key to the client
CREATE OR REPLACE FUNCTION spend_credits(_amount INTEGER, _action TEXT, _model TEXT, _node_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    _current_balance INTEGER;
BEGIN
    -- 1. Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- 2. Get current balance
    SELECT credits_balance INTO _current_balance
    FROM profiles
    WHERE user_id = auth.uid()
    FOR UPDATE;

    IF _current_balance IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- 3. Check sufficiency
    IF _current_balance < _amount THEN
        RAISE EXCEPTION 'Insufficient credits. Need %, have %', _amount, _current_balance;
    END IF;

    -- 4. Deduct and Log Transaction
    UPDATE profiles
    SET credits_balance = _current_balance - _amount
    WHERE user_id = auth.uid();

    INSERT INTO transactions (user_id, node_id, type, amount, description)
    VALUES (auth.uid(), _node_id, 'generation', -_amount, _action || ' using ' || _model);

    -- 5. Audit Log (Success)
    -- We can also insert into ai_audit_logs if the table exists
    -- For now, transaction log is enough to track usage
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refund credits if AI processing fails
CREATE OR REPLACE FUNCTION refund_credits(_amount INTEGER, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET credits_balance = credits_balance + _amount
    WHERE user_id = _user_id;

    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (_user_id, 'refund', _amount, 'Refund for failed AI generation');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
