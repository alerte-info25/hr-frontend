import { AttributionPrime } from "./attribution-prime.model";

export interface Paiement {
  id?: number;
  attribution_prime_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: 'virement' | 'especes' | 'mobile_money' | 'cheque';
  reference?: string;
  commentaire?: string;
  slug?: string;
  attribution_prime?: AttributionPrime;
  created_at?: string;
  updated_at?: string;
}
