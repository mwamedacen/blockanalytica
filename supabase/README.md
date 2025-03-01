# Supabase Setup for BlockAnalytica

This directory contains the database schema and setup instructions for the Supabase backend used by BlockAnalytica.

## Setup Instructions

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to the SQL Editor in your Supabase dashboard
4. Copy the contents of `schema.sql` and run it in the SQL Editor
5. Get your Supabase URL and API keys from the API settings page
6. Add the following environment variables to your `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

## Database Schema

### user_wallets

This table stores user wallet information:

- `id`: UUID primary key
- `user_id`: The Privy user ID
- `wallet_address`: The Ethereum wallet address
- `encrypted_private_key`: The encrypted private key
- `is_primary`: Whether this is the user's primary wallet
- `created_at`: Timestamp when the wallet was created
- `updated_at`: Timestamp when the wallet was last updated

### transactions

This table tracks user transactions:

- `id`: UUID primary key
- `user_id`: The Privy user ID
- `wallet_address`: The wallet address used for the transaction
- `tx_hash`: The transaction hash
- `network`: The blockchain network (e.g., ethereum, base)
- `to_address`: The recipient address
- `value`: The transaction value in ETH
- `data`: The transaction data
- `status`: The transaction status (pending, confirmed, failed)
- `created_at`: Timestamp when the transaction was created
- `updated_at`: Timestamp when the transaction was last updated

## Row Level Security (RLS)

The database uses Row Level Security to ensure that users can only access their own data. The service role key is used for server-side operations that need to access or modify data for any user. 