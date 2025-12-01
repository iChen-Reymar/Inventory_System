-- ============================================
-- Add Wallet System to Inventory Management
-- ============================================

-- Add wallet_balance column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (wallet_balance >= 0);

-- Update existing profiles to have 0.00 wallet balance
UPDATE profiles 
SET wallet_balance = 0.00 
WHERE wallet_balance IS NULL;

-- Create RPC function to add funds to wallet (cash-in)
CREATE OR REPLACE FUNCTION add_wallet_funds(
    p_user_id UUID,
    p_amount DECIMAL(10, 2)
)
RETURNS TABLE(new_balance DECIMAL(10, 2)) AS $$
DECLARE
    v_new_balance DECIMAL(10, 2);
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;
    
    -- Update wallet balance
    UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    RETURN QUERY SELECT v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_sale function to deduct from wallet
CREATE OR REPLACE FUNCTION create_sale (
    p_user_id UUID,
    p_cash DECIMAL(10, 2),
    p_items JSONB
)
RETURNS TABLE(sale_id UUID) AS $$
DECLARE
    v_sale_id UUID;
    v_total DECIMAL(10, 2) := 0;
    v_item JSONB;
    v_item_total DECIMAL(10, 2);
    v_wallet_balance DECIMAL(10, 2);
BEGIN
    -- Calculate total from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'qty')::INTEGER * (v_item->>'unit_price')::DECIMAL(10, 2);
        v_total := v_total + v_item_total;
    END LOOP;
    
    -- Get current wallet balance
    SELECT COALESCE(wallet_balance, 0) INTO v_wallet_balance
    FROM profiles
    WHERE id = p_user_id;
    
    -- Check if wallet has sufficient funds
    IF v_wallet_balance < v_total THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Current balance: ₱%, Required: ₱%', v_wallet_balance, v_total;
    END IF;
    
    -- Create sale record (cash is now the wallet balance used, change is 0)
    INSERT INTO sales (user_id, total, cash, change)
    VALUES (p_user_id, v_total, v_total, 0)
    RETURNING id INTO v_sale_id;
    
    -- Create sale items and update inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert sale item
        INSERT INTO sale_items (sale_id, inventory_id, quantity, unit_price)
        VALUES (
            v_sale_id,
            (v_item->>'inventory_id')::UUID,
            (v_item->>'qty')::INTEGER,
            (v_item->>'unit_price')::DECIMAL(10, 2)
        );
        
        -- Decrement inventory
        PERFORM decrement_inventory (
            (v_item->>'inventory_id')::UUID,
            (v_item->>'qty')::INTEGER
        );
    END LOOP;
    
    -- Deduct from wallet balance
    UPDATE profiles
    SET wallet_balance = wallet_balance - v_total
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- END OF WALLET SYSTEM MIGRATION
-- ============================================

