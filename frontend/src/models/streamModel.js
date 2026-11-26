/**
 * Stream & Sentence Model (Frontend MVC - Model Layer)
 * Pure stream delimiter sanitization, Web Speech sentence tokenization,
 * and BYOK HTTP header assembly.
 */

export function buildByokHeaders(byok = {}, includeJsonContentType = true) {
  const headers = includeJsonContentType ? { 'Content-Type': 'application/json' } : {};
  if (byok?.groq) headers['x-byok-groq'] = byok.groq;
  if (byok?.gemini) headers['x-byok-gemini'] = byok.gemini;
  if (byok?.openrouter) headers['x-byok-openrouter'] = byok.openrouter;
  if (byok?.huggingface) headers['x-byok-hf'] = byok.huggingface;
  return headers;
}

export function tokenizeSentences(paragraphText) {
  if (!paragraphText || typeof paragraphText !== 'string') return [];

  const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z0-9"“«])/g;
  const rawSentences = paragraphText.split(sentenceRegex);

  let currentOffset = 0;
  return rawSentences.map((text, idx) => {
    const trimmed = text.trim();
    const startChar = paragraphText.indexOf(trimmed, currentOffset);
    const endChar = startChar + trimmed.length;
    currentOffset = endChar;

    return {
      sentenceIdx: idx,
      text: trimmed,
      startChar,
      endChar
    };
  });
}

export function mapCharIndexToSentence(tokens, charIndex) {
  if (!tokens || tokens.length === 0) return -1;
  for (const token of tokens) {
    if (charIndex >= token.startChar && charIndex <= token.endChar) {
      return token.sentenceIdx;
    }
  }
  return tokens[tokens.length - 1].sentenceIdx;
}

export function stripLeadingPreamble(text) {
  if (!text || typeof text !== 'string') return { cleaned: '', preamble: '' };
  let cleaned = text;
  let capturedPreamble = '';

  const blockRegex = /^\s*(?:we need to write|outline:|let's plan|here is the story)[\s\S]*?\n\s*\n/i;
  let match;
  while ((match = cleaned.match(blockRegex))) {
    capturedPreamble += (capturedPreamble ? '\n\n' : '') + match[0].trim();
    cleaned = cleaned.slice(match[0].length);
  }

  const labelRegex = /^\s*(?:here is (?:the|your) story|here's the story|here is chapter \d+)[:\s]*\n*/i;
  const labelMatch = cleaned.match(labelRegex);
  if (labelMatch) {
    capturedPreamble += (capturedPreamble ? '\n\n' : '') + labelMatch[0].trim();
    cleaned = cleaned.slice(labelMatch[0].length);
  }

  return { cleaned: cleaned.trimStart(), preamble: capturedPreamble };
}

export function sanitizeClientStreamBuffer(rawBuffer) {
  if (!rawBuffer || typeof rawBuffer !== 'string') {
    return { thinking: '', prose: '' };
  }

  let working = rawBuffer;
  let thinking = '';
  let prose = '';

  const trimmed = working.trimStart();
  if (trimmed.length > 0 && trimmed.length < 10 && '<thinking>'.startsWith(trimmed)) {
    return { thinking: '', prose: '' };
  }

  const thinkingStart = working.indexOf('<thinking>');
  if (thinkingStart !== -1) {
    const thinkingEnd = working.indexOf('</thinking>');
    if (thinkingEnd !== -1) {
      thinking = working.slice(thinkingStart + 10, thinkingEnd).trim();
      working = working.slice(thinkingEnd + 11);
    } else {
      const storyStartIdx = working.indexOf('[STORY_START]');
      if (storyStartIdx !== -1 && storyStartIdx > thinkingStart) {
        thinking = working.slice(thinkingStart + 10, storyStartIdx).trim();
        working = working.slice(storyStartIdx);
      } else {
        thinking = working.slice(thinkingStart + 10).trim();
        return { thinking, prose: '' };
      }
    }
  }

  const branchIdx = working.indexOf('[BRANCH_CHOICES]');
  if (branchIdx !== -1) {
    working = working.slice(0, branchIdx);
  }

  const storyStartIdx = working.indexOf('[STORY_START]');
  if (storyStartIdx !== -1) {
    const preText = working.slice(0, storyStartIdx).trim();
    if (preText && !thinking) {
      thinking = preText;
    }
    const afterStart = working.slice(storyStartIdx + 13);
    const storyEndIdx = afterStart.indexOf('[STORY_END]');
    prose = storyEndIdx !== -1 ? afterStart.slice(0, storyEndIdx) : afterStart;
  } else {
    const workingTrimmed = working.trimStart();
    if (workingTrimmed.length > 0 && workingTrimmed.length < 13 && '[STORY_START]'.startsWith(workingTrimmed)) {
      return { thinking, prose: '' };
    }

    const preamblePrefixRegex = /^\s*(?:we need to write|outline:|let's plan|here is the story)/i;
    if (preamblePrefixRegex.test(working)) {
      const blockMatch = working.match(/^\s*(?:we need to write|outline:|let's plan|here is the story)[\s\S]*?\n\s*\n/i);
      if (blockMatch) {
        if (!thinking) {
          thinking = blockMatch[0].trim();
        }
        working = working.slice(blockMatch[0].length);
        const nextStartIdx = working.indexOf('[STORY_START]');
        if (nextStartIdx !== -1) {
          const after = working.slice(nextStartIdx + 13);
          const endIdx = after.indexOf('[STORY_END]');
          prose = endIdx !== -1 ? after.slice(0, endIdx) : after;
        } else {
          const postTrim = working.trimStart();
          if (postTrim.length > 0 && postTrim.length < 13 && '[STORY_START]'.startsWith(postTrim)) {
            return { thinking, prose: '' };
          }
          prose = working;
        }
      } else {
        thinking = working.trim();
        return { thinking, prose: '' };
      }
    } else {
      const storyEndIdx = working.indexOf('[STORY_END]');
      prose = storyEndIdx !== -1 ? working.slice(0, storyEndIdx) : working;
    }
  }

  const sanitizedProse = stripLeadingPreamble(prose);
  if (sanitizedProse.preamble && !thinking) {
    thinking = sanitizedProse.preamble;
  }
  prose = sanitizedProse.cleaned;

  prose = prose
    .replace(/\[\/?STORY_(?:START|END)\]/gi, '')
    .replace(/\[\/?BRANCH_CHOICES\]/gi, '')
    .replace(/<\/?thinking>/gi, '');

  for (const tag of ['[STORY_START]', '[STORY_END]', '[BRANCH_CHOICES]', '[/BRANCH_CHOICES]', '</thinking>']) {
    for (let len = tag.length - 1; len >= 1; len--) {
      if (prose.endsWith(tag.slice(0, len))) {
        prose = prose.slice(0, -len);
        break;
      }
    }
  }

  return {
    thinking,
    prose: prose.trimStart()
  };
}
