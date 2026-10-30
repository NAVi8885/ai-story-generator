import http from 'http';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function testHealth() {
  console.log('\n--- 1. Backend Health Check ---');
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/api/health', (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          assert(json.status === 'ok', 'Server health endpoint returned status ok');
          const providers = json.providers || json.activeProviders;
          assert(Array.isArray(providers), 'Server returns active providers');
          console.log('    Active providers:', providers.join(', '));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testLiveSSEGeneration() {
  console.log('\n--- 2. Live HTTP SSE Story Stream Generation ---');
  const postData = JSON.stringify({
    prompt: 'Evan reincarnated across human history. He wakes up with memories of a modern engineer inside a Roman gladiatorial forge.',
    sliders: { targetLength: 'flash', creativity: 0.85, strictness: 85, thinkingDepth: 'fast' },
    genre: 'fantasy',
    includeBranchChoices: true
  });

  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/generate/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      assert(res.statusCode === 200, 'SSE stream returned status 200');
      assert(res.headers['content-type']?.includes('text/event-stream'), 'Content-type is text/event-stream');

      let buffer = '';
      let completeEvent = null;
      let streamedProseChunks = [];
      let streamedThinkingChunks = [];

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'complete') {
                completeEvent = data;
              } else if (currentEvent === 'chunk') {
                if (data.type === 'prose') streamedProseChunks.push(data.text);
                if (data.type === 'thinking') streamedThinkingChunks.push(data.text);
              }
            } catch {}
          }
        }
      });

      res.on('end', () => {
        console.log('    SSE Stream completed.');
        const fullStreamedProse = streamedProseChunks.join('');
        const fullStreamedThinking = streamedThinkingChunks.join('');

        console.log(`    Streamed Prose length: ${fullStreamedProse.length} chars (${streamedProseChunks.length} chunks)`);
        console.log(`    Streamed Thinking length: ${fullStreamedThinking.length} chars (${streamedThinkingChunks.length} chunks)`);
        
        assert(completeEvent !== null, 'Received "complete" event from SSE stream');
        if (completeEvent) {
          const prose = completeEvent.prose || '';
          console.log('\n    --- Prose Preview ---');
          console.log('    ' + JSON.stringify(prose.slice(0, 160)) + '...');
          console.log('    Branch choices count:', completeEvent.branchChoices?.length);
          if (completeEvent.branchChoices?.length > 0) {
            console.log('    Choice 1:', completeEvent.branchChoices[0].title, '->', completeEvent.branchChoices[0].description);
          }

          assert(prose.length > 80, 'Prose output has substantial length');
          assert(!prose.toLowerCase().includes('we need to write'), 'Prose is free of "we need to write" meta-talk');
          assert(!prose.toLowerCase().includes('outline:'), 'Prose is free of "outline:"');
          assert(!prose.toLowerCase().includes('let\'s plan'), 'Prose is free of "let\'s plan"');
          assert(!prose.includes('[STORY_START]'), 'Prose has no [STORY_START] delimiter leak');
          assert(!prose.includes('[STORY_END]'), 'Prose has no [STORY_END] delimiter leak');
          assert(!prose.includes('<thinking>'), 'Prose has no <thinking> tag leak');
          assert(!prose.includes('[BRANCH_CHOICES]'), 'Prose has no [BRANCH_CHOICES] delimiter leak');
          assert(Array.isArray(completeEvent.branchChoices) && completeEvent.branchChoices.length > 0, 'Cleanly parsed interactive branch choices');
        }

        console.log(`\n========================================`);
        console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
        console.log(`========================================\n`);

        if (failed > 0) {
          reject(new Error(`${failed} assertion(s) failed`));
        } else {
          resolve();
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

try {
  await testHealth();
  await testLiveSSEGeneration();
  process.exit(0);
} catch (err) {
  console.error('Verification failed:', err);
  process.exit(1);
}
