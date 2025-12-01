# Database Setup Instructions

This directory contains the SQL schema for the Inventory Management System.

## Quick Setup

1. **Go to your Supabase project**: https://app.supabase.com
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `schema.sql`**
4. **Run the SQL script**

## What's Included

### Tables
- **profiles** - User profile information
- **inventory** - Product inventory
- **sales** - Sales/orders
- **sale_items** - Individual items in each sale

### Features
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Automatic timestamp updates
- ✅ RPC functions for complex operations
- ✅ Foreign key constraints
- ✅ Data validation checks

## RPC Functions

### `decrement_inventory(p_id UUID, p_qty INTEGER)`
Decrements inventory quantity safely.

### `create_sale(p_user_id UUID, p_cash DECIMAL, p_items JSONB)`
Creates a sale with multiple items and automatically:
- Calculates total
- Creates sale record
- Creates sale items
- Updates inventory quantities

## Security

All tables have Row Level Security (RLS) enabled:
- **Users** can only see/modify their own data
- **Admins** have full access to inventory management
- **Public** can view inventory (products)

## Testing

After running the schema, you can:
1. Create a user account through the app
2. Set user role to 'admin' in the profiles table for admin access
3. Add products through the admin dashboard

## Notes

- Make sure you have the `uuid-ossp` extension enabled (included in script)
- The schema uses UUIDs for all primary keys
- All timestamps are in UTC (TIMESTAMPTZ)
- Prices are stored as DECIMAL(10, 2) for precision





