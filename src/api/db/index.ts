import { Low } from 'lowdb/lib';
import { JSONFilePreset } from 'lowdb/node'

export interface Pair {
  address: string;
  token0: string;
  token1: string;
}

export interface Transaction {
  pair: Pair;
  amount: number;
}

export interface Execution {
  isLive: boolean;
  pair: Pair;
  buyTransaction: Transaction;
  transactions: Transaction[];
}

export interface Data {
  pairs: Record<string, Pair>;
  executions: Record<string, Execution>; // by pair address
}

const defaultData: Data = { pairs: {}, executions: {} }

let _DB: Low<Data>;

export const db = async (): Promise<Low<Data>> => {
  if (_DB == null) {
    _DB = await JSONFilePreset<Data>('data.json', defaultData);
  }
  return _DB;
}
