declare module '@coinbase/onchainkit/wallet' {
  import { FC } from 'react';
  export const WalletDefault: FC;
  export const WalletDropdown: FC;
}

declare module '@coinbase/onchainkit/swap' {
  import { FC } from 'react';
  
  interface SwapDefaultProps {
    from?: string[];
    to?: string[];
  }
  
  export const SwapDefault: FC<SwapDefaultProps>;
  export const SwapAmountInput: FC;
  export const SwapButton: FC;
}

declare module '@coinbase/onchainkit/transaction' {
  import { FC } from 'react';
  
  interface TransactionProps {
    hash: string;
    chainId: number | string;
  }
  
  export const Transaction: FC<TransactionProps>;
}

declare module '@coinbase/onchainkit/identity' {
  import { FC } from 'react';
  export const Identity: FC<{ address: string; children: React.ReactNode }>;
  export const Avatar: FC;
  export const Name: FC;
} 