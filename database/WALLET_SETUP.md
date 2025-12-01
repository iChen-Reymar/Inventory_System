# Wallet System Setup Guide

This guide explains how to set up the wallet system for the Inventory Management System.

## Overview

The wallet system allows users to:
- Add funds to their wallet (cash-in)
- Purchase products using wallet balance
- View their current wallet balance

## Database Setup

### Step 1: Run the Migration

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open the file `database/add_wallet_system.sql`
4. Copy and paste the entire SQL script
5. Click **Run** to execute

### What the Migration Does

1. **Adds `wallet_balance` column** to the `profiles` table
   - Type: `DECIMAL(10, 2)`
   - Default: `0.00`
   - Constraint: Must be >= 0

2. **Creates `add_wallet_funds` RPC function**
   - Allows users to add funds to their wallet
   - Validates amount > 0
   - Returns new balance

3. **Updates `create_sale` RPC function**
   - Checks wallet balance before creating sale
   - Automatically deducts purchase amount from wallet
   - Prevents purchases if insufficient funds

## Features

### For Users

1. **View Wallet Balance**
   - Displayed on Profile page
   - Shown in stats card

2. **Cash-In Funds**
   - Available on Profile page
   - Enter amount and click "Add Funds"
   - Funds are immediately added to wallet

3. **Purchase with Wallet**
   - Checkout page shows wallet balance
   - Automatically uses wallet funds for payment
   - Shows remaining balance after purchase
   - Prevents purchase if insufficient funds

### For Admins

- Admins can view user profiles (including wallet balances) through the admin dashboard
- Wallet balances are managed by users themselves

## Security

- Row Level Security (RLS) ensures users can only:
  - View their own wallet balance
  - Add funds to their own wallet
  - Use their own wallet for purchases

- The `create_sale` function validates:
  - Wallet has sufficient funds
  - Amount is valid
  - User exists

## Testing

After setup:

1. **Test Cash-In:**
   - Go to Profile page
   - Enter an amount (e.g., 1000.00)
   - Click "Add Funds"
   - Verify balance updates

2. **Test Purchase:**
   - Add items to cart
   - Go to Checkout
   - Verify wallet balance is shown
   - Complete purchase
   - Verify balance is deducted

3. **Test Insufficient Funds:**
   - Try to purchase items worth more than wallet balance
   - Verify error message appears
   - Verify purchase is blocked

## Troubleshooting

### Issue: Wallet balance not showing

**Solution:** Make sure you've run the SQL migration and the `wallet_balance` column exists in the `profiles` table.

### Issue: Cash-in not working

**Solution:** 
- Check that the `add_wallet_funds` RPC function exists
- Verify RLS policies allow users to update their own profile
- Check browser console for errors

### Issue: Purchase not deducting from wallet

**Solution:**
- Verify the updated `create_sale` function is in the database
- Check that the function includes wallet deduction logic
- Verify RLS policies allow the function to update profiles

## Notes

- Wallet balance starts at ₱0.00 for new users
- Users must cash-in before making purchases
- Wallet balance cannot go negative (enforced by database constraint)
- All amounts are in Philippine Peso (₱)

