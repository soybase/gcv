import { GET, POST, Server } from '../models/server.model';

export const SERVERS: Server[] = [
  {
    id: 'lfo',
    name: 'Legume Federation Outgroups',
    microBasic: {
      type: POST,
      url: '/lis_context_server/services/basic_tracks_tree_agnostic/'
    },
    microSearch: {
      type: POST,
      url: '/lis_context_server/services/search_tracks_tree_agnostic/'
    },
    microQuery: {
      type: POST,
      url: '/lis_context_server/services/gene_to_query/'
    },
    macro: {
      type: POST,
      url: '/lis_context_server/services/synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'https://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: '/lis_context_server/services/global_plot_provider_agnostic/'
    }
  },
  {
    id: 'lis',
    name: 'Legume Information System',
    microBasic: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/basic_tracks_tree_agnostic/'
    },
    microSearch: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/search_tracks_tree_agnostic/'
    },
    microQuery: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/gene_to_query/'
    },
    macro: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'https://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/global_plot_provider_agnostic/'
    }
  }
];
