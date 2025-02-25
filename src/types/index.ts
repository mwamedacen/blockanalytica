// Common types for the application

export enum SwapSide {
  BUY = "BUY",
  SELL = "SELL"
}

export interface DateRange {
  startDate: string; // ISO format date
  endDate: string;   // ISO format date
}

export interface WalletSwap {
  wallet_address: string;
  token_address: string;
  token_symbol: string;
  amount: number;
  usd_amount: number;
  side: SwapSide;
  timestamp: string;
  tx_hash: string;
}

export interface TokenSwap {
  wallet_address: string;
  token_address: string;
  token_symbol: string;
  amount: number;
  usd_amount: number;
  side: SwapSide;
  timestamp: string;
  tx_hash: string;
}

export interface CopyTraderResult {
  target_wallet: string;
  copy_traders: {
    wallet_address: string;
    correlated_swaps: {
      token_address: string;
      token_symbol: string;
      target_swap_time: string;
      copy_swap_time: string;
      time_delay_seconds: number;
      target_usd_amount: number;
      copy_usd_amount: number;
    }[];
    avg_time_delay_seconds: number;
    avg_volume_ratio: number;
  }[];
  total_copy_traders_found: number;
} 