import { PEOPLE } from './constants';

export type Person = typeof PEOPLE[number];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: Person;
  participants: Person[];
}

export interface Settlement {
  from: Person;
  to: Person;
  amount: number;
}
