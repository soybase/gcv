import { GET, POST, Server } from '../models/server.model';

export const SERVERS: Server[] = [
  {
    id: 'lfo',
    name: 'Legume Federation Outgroups',
    microBasic: {
      type: POST,
      url: '/lis_context_server/services/v1/micro-synteny-basic/'
    },
    microSearch: {
      type: POST,
      url: '/lis_context_server/services/v1/micro-synteny-search/'
    },
    microQuery: {
      type: POST,
      url: '/lis_context_server/services/v1/gene-to-query-track/'
    },
    macro: {
      type: POST,
      url: '/lis_context_server/services/v1/macro-synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'https://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: '/lis_context_server/services/v1/global-plots/'
    },
    nearestGene: {
      type: POST,
      url: '/lis_context_server/services/v1/nearest-gene/'
    }
  },
  {
    id: 'lis',
    name: 'Legume Information System',
    microBasic: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/micro-synteny-basic/'
    },
    microSearch: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/micro-synteny-search/'
    },
    microQuery: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/gene-to-query-track/'
    },
    macro: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/macro-synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'https://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/global-plots/'
    },
    nearestGene: {
      type: POST,
      url: 'https://legumeinfo.org/lis_context_server/services/v1/nearest-gene/'
    }
  }
];
