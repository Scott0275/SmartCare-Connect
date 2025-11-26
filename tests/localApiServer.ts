const http = require('http');
const url = require('url');

// Load lambda handlers (CommonJS)
const healthHandler = require('../lambda/health/index.js').handler;
const patientsHandler = require('../lambda/patients/index.js').handler;
const analyticsHandler = require('../lambda/analytics/index.js').handler;
const createUserHandler = require('../lambda/createUser/index.js').handler;

function parseBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

function mapRequestToEvent(req: import('http').IncomingMessage, parsedUrl: URL, bodyString: string | null) {
  const query = Object.fromEntries(parsedUrl.searchParams || new URLSearchParams(parsedUrl.query || ''));
  let body = undefined;
  if (bodyString) {
    try { body = JSON.parse(bodyString); } catch { body = bodyString; }
  }

  return {
    httpMethod: req.method,
    path: parsedUrl.pathname,
    headers: req.headers || {},
    queryStringParameters: query,
    body: bodyString || null
  };
}

function sendLambdaResponse(res, lambdaResponse) {
  const statusCode = lambdaResponse?.statusCode || 200;
  const headers = lambdaResponse?.headers || {};
  const body = lambdaResponse?.body || '';
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.statusCode = statusCode;
  if (typeof body === 'string') {
    res.end(body);
  } else {
    res.end(JSON.stringify(body));
  }
}

function routeEvent(event) {
  const path = event.path || event.path || '/';
  if (path.startsWith('/api/health')) return healthHandler(event);
  if (path.startsWith('/api/patients')) return patientsHandler(event);
  if (path.startsWith('/api/analytics')) return analyticsHandler(event);
  if (path.startsWith('/api/createUser')) return createUserHandler(event);
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Requested resource not found' })
  };
}

module.exports = {
  start: (port = 0) => new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const bodyString = await parseBody(req);
        const event = mapRequestToEvent(req, parsedUrl, bodyString);
        const lambdaRes = await routeEvent(event);
        sendLambdaResponse(res, lambdaRes);
      } catch (err) {
        console.error('localApiServer error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    server.listen(port, () => {
      const addr = server.address();
      const url = typeof addr === 'object' ? `http://127.0.0.1:${addr.port}/api` : `http://127.0.0.1:${addr}/api`;
      resolve({ server, url });
    });
  }),
};
