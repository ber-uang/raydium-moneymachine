import { FC } from 'react';

export interface DexScreenPairDetailsEmbeddingProps {
  readonly pair: string;
}

export const DexScreenPairDetailsEmbedding: FC<DexScreenPairDetailsEmbeddingProps> = ({ pair }) => {
  return (
    <>
      <div id="dexscreener-embed">
        <iframe src={`https://dexscreener.com/solana/${pair}?embed=1&theme=dark`}></iframe>
      </div>
    </>
  )
}
