// A chromosome is an instance of Track that represents an entire chromosome
// as an ordered list of genes and a corresponding list of gene families. This
// file provides an NgRx reducer and selectors for storing and accessing
// chromosome data. Specifically, a chromosome is loaded as a Track for each
// gene provided by the user. These Tracks are stored by the chromosome reducer
// and made available via selectors. This includes a selector that provides the
// neighborhood each user provided gene occurs is as a slice of the gene's
// chromosome.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as chromosomeActions from '@gcv/gene/store/actions/chromosome.actions';
// app
import { Track } from '@gcv/gene/models';

declare var Object: any;  // because TypeScript doesn't support Object.values

export const chromosomeFeatureKey = 'chromosome';

export type ChromosomeID = {name: string, source: string};

export function chromosomeID(name: string, source: string): string;
export function chromosomeID({name, source}): string;
export function chromosomeID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return chromosomeID(id.name, id.source);
  }
  const [name, source] = args;
  return `${name}:${source}`;
}

const adapter = createEntityAdapter<Track>({
  selectId: (e) => chromosomeID(e.name, e.source)
});

// TODO: is loaded even necessary or can it be derived from entity ids and
// selectedChromosomeIDs selector?
export interface State extends EntityState<Track> {
  failed: ChromosomeID[];
  loaded: ChromosomeID[];
  loading: ChromosomeID[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: chromosomeActions.Actions
): State {
  switch (action.type) {
    case chromosomeActions.GET:
      return {
        ...state,
        loading: state.loading.concat([action.payload]),
      };
    case chromosomeActions.GET_SUCCESS:
    {
      const chromosome = action.payload.chromosome;
      const id = {name: chromosome.name, source: chromosome.source};
      return adapter.addOne(
        chromosome,
        {
          ...state,
          loaded: state.loaded.concat(id),
          loading: state.loading.filter(({name, source}) => {
            return !(name === id.name && source === id.source);
          }),
        },
      );
    }
    case chromosomeActions.GET_FAILURE:
    {
      const id = action.payload;
      return {
        ...state,
        failed: state.failed.concat(action.payload),
        loading: state.loading.filter(({name, source}) => {
          return !(name === id.name && source === id.source);
        }),
      };
    }
    default:
      return state;
  }
}