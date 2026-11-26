/**
 * Stream & JSON Response Presenter (MVC - View Layer)
 * Formats Server-Sent Events (SSE) frames, heartbeat keep-alives,
 * and standard REST API JSON payloads cleanly separated from controllers.
 */

export function initSseStream(res, abortController) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const keepAliveTimer = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 12000);

  res.on('close', () => {
    clearInterval(keepAliveTimer);
    if (!res.writableEnded) {
      console.log('[Stream Connection] Client disconnected prematurely. Aborting upstream generation.');
      abortController.abort();
    }
  });

  const sendEvent = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const endStream = () => {
    clearInterval(keepAliveTimer);
    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  const endWithError = (errorMessage) => {
    clearInterval(keepAliveTimer);
    if (!res.writableEnded) {
      sendEvent('error', { error: errorMessage || 'Stream generation failed' });
      res.end();
    }
  };

  return { sendEvent, endStream, endWithError, keepAliveTimer };
}

export function presentJsonSuccess(res, payload, statusCode = 200) {
  if (res.writableEnded) return;
  res.status(statusCode).json(payload);
}

export function presentJsonError(res, statusCode = 500, errorMessage = 'Internal server error') {
  if (res.writableEnded) return;
  res.status(statusCode).json({ error: errorMessage });
}
