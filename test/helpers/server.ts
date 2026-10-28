import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface Received {
  method: string;
  url: string;
  headers: IncomingMessage['headers'];
  body: string;
}

export type Handler = (
  request: Received,
  response: ServerResponse,
  index: number,
) => void | Promise<void>;

/** A local HTTP server on a free port that records every request. */
export async function startServer(handler: Handler) {
  const received: Received[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk as Buffer);
    const entry = {
      method: request.method ?? '',
      url: request.url ?? '',
      headers: request.headers,
      body: Buffer.concat(chunks).toString('utf8'),
    };
    received.push(entry);
    await handler(entry, response, received.length - 1);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    received,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

export const reply =
  (status: number, body = '', headers: Record<string, string> = {}): Handler =>
  (_request, response) => {
    response.writeHead(status, headers).end(body);
  };
