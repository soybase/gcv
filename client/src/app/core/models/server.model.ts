export const GET = 'GET';
export const POST = 'POST';

export class Request {
  type: 'GET' | 'POST';
  url: string;
}

export class Server {
  id: string;  // unique & url friendly
  name: string;
  microMulti: Request;
  microSearch: Request;
  microQuery: Request;
  macro: Request;
  geneLinks: Request;
  familyTreeLink: Request;
  nearestGene: Request;
  chromosome: Request;
  spanToSearch: Request;
}