import { Gene } from "./gene.model";

export class Group {
  species_id: string;
  genus: string;
  species: string;
  chromosome_id: string;
  chromosome_name: string;
  genes: Gene[];
  // TODO: introduce options as mixins
  source?: string;  // Server ID
  id?: string;  // unique
  score?: number;
  cluster?: number;
}
