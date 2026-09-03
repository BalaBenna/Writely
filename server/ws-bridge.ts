import { WebSocketServer, WebSocket } from 'ws';
import { analyzeDocument } from '../src/engine/hybridEngine';
import { rewriteText } from '../src/engine/rewriter';

const PORT = 8765;
const HOST = '127.0.0.1';

const wss = new WebSocketServer({ port: PORT, host: HOST }, () => {
  console.log(`[Writely Bridge] Local WebSocket server listening on ws://${HOST}:${PORT}`);
  console.log(`[Writely Bridge] Ready for Chrome/Edge extensions & system overlays (<50ms realtime)`);
});

wss.on('connection', (ws: WebSocket) => {
  console.log('[Writely Bridge] Client connected (extension or desktop overlay)');

  ws.on('message', async (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.action) {
        case 'ping':
          ws.send(JSON.stringify({
            status: 'ok',
            app: 'Writely Engine',
            version: '1.0.0',
            offline: true,
            latencySla: '<150ms',
          }));
          break;

        case 'analyze': {
          const t0 = performance.now();
          const result = analyzeDocument(msg.text || '');
          const duration = Math.round(performance.now() - t0);
          ws.send(JSON.stringify({
            id: msg.id,
            action: 'analyze_result',
            suggestions: result.suggestions,
            metrics: result.metrics,
            telemetry: {
              ...result.telemetry,
              bridgeRoundtripMs: duration,
            },
          }));
          break;
        }

        case 'rewrite': {
          const res = await rewriteText(msg.text || '', msg.tone || 'professional');
          ws.send(JSON.stringify({
            id: msg.id,
            action: 'rewrite_result',
            result: res,
          }));
          break;
        }

        default:
          ws.send(JSON.stringify({ error: `Unknown action: ${msg.action}` }));
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ error: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[Writely Bridge] Client disconnected');
  });
});
