/**
 * Cast Extractor Utility
 * Pure algorithmic entity extraction for Dramatis Personae.
 * Scans prose for dialogue attributions, proper nouns, and capitalized entities
 * to infer character rosters, roles, psychological states, motivations, quirks, and tension.
 */

export const COMMON_STOP_WORDS = new Set([
  'The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'Where', 'When',
  'What', 'Who', 'Why', 'How', 'Then', 'Now', 'Once', 'Soon', 'Suddenly',
  'After', 'Before', 'While', 'Although', 'Because', 'Since', 'If', 'Unless',
  'Chapter', 'Section', 'Book', 'Part', 'Act', 'Scene', 'Episode',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'North', 'South', 'East', 'West',
  'He', 'She', 'They', 'It', 'We', 'You', 'His', 'Her', 'Their', 'My', 'Our',
  'And', 'But', 'Or', 'Nor', 'For', 'Yet', 'So', 'Both', 'Either', 'Neither',
  'In', 'On', 'At', 'To', 'From', 'With', 'Without', 'By', 'About', 'Into',
  'Over', 'Under', 'Above', 'Below', 'Behind', 'Beneath', 'Between', 'Beyond',
  'Quickly', 'Slowly', 'Finally', 'Instantly', 'Meanwhile', 'Despite', 'Commander',
  'Brother', 'Sister', 'Captain', 'Doctor', 'Lord', 'Lady'
]);

export const DIALOGUE_VERBS = new Set([
  'said', 'asked', 'replied', 'whispered', 'shouted', 'muttered', 'growled',
  'screamed', 'yelled', 'barked', 'commanded', 'sighed', 'breathed', 'snapped',
  'cried', 'gasped', 'insisted', 'murmured', 'urged', 'warned', 'demanded',
  'called', 'snarled', 'argued', 'hissed', 'scoffed', 'roared', 'bellowed',
  'stammered', 'pleaded', 'vowed', 'chuckled', 'admitted', 'confessed', 'boomed'
]);

/**
 * Extracts cast entities from narrative prose.
 * @param {string} prose - Story prose to analyze.
 * @returns {Array<object>} Roster of character cards conforming to Dramatis Personae schema.
 */
export function extractCastFromProse(prose) {
  if (!prose || typeof prose !== 'string' || !prose.trim()) {
    return [];
  }

  const text = prose.trim();
  const characterScores = new Map(); // name -> { name, count, dialogueCount }

  // 1. Scan for dialogue attributions: "..." said Marcus / Marcus said "..."
  const quotePattern = /["“«]([^"”»]+)["”»]\s*([a-zA-Z\s,]+)[.!?]|([A-Z][a-z]+)\s+([a-z]+)\s*["“«]/g;
  let match;

  while ((match = quotePattern.exec(text)) !== null) {
    if (match[2]) {
      // e.g. "said Marcus" or "Elena whispered"
      const postQuote = match[2].trim();
      const words = postQuote.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const w = words[i].replace(/[^a-zA-Z]/g, '');
        if (w && /^[A-Z][a-z]+$/.test(w) && !COMMON_STOP_WORDS.has(w)) {
          const current = characterScores.get(w) || { name: w, count: 0, dialogueCount: 0 };
          current.count += 2;
          current.dialogueCount += 1;
          characterScores.set(w, current);
        }
      }
    }
    if (match[3]) {
      const speaker = match[3];
      const verb = (match[4] || '').toLowerCase();
      if (/^[A-Z][a-z]+$/.test(speaker) && !COMMON_STOP_WORDS.has(speaker) && DIALOGUE_VERBS.has(verb)) {
        const current = characterScores.get(speaker) || { name: speaker, count: 0, dialogueCount: 0 };
        current.count += 2;
        current.dialogueCount += 1;
        characterScores.set(speaker, current);
      }
    }
  }

  // 2. Scan capitalized entity mentions throughout prose
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (/^[A-Z][a-z]{2,}$/.test(cleanWord) && !COMMON_STOP_WORDS.has(cleanWord)) {
      // Exclude first word of sentences if preceded by sentence-ending punctuation
      const prevWord = i > 0 ? words[i - 1] : '';
      const isSentenceStart = i === 0 || /[.!?]["'”»]?$/.test(prevWord);
      if (!isSentenceStart || characterScores.has(cleanWord)) {
        const current = characterScores.get(cleanWord) || { name: cleanWord, count: 0, dialogueCount: 0 };
        current.count += 1;
        characterScores.set(cleanWord, current);
      }
    }
  }

  // Sort candidates by prominence
  const sorted = Array.from(characterScores.values())
    .filter(c => c.count >= 2 || c.dialogueCount >= 1)
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return [];
  }

  const roles = ['Protagonist', 'Foil', 'Antagonist', 'Ally'];
  const defaultMotivations = [
    'Uncover the hidden truth behind the breach',
    'Challenge and expose flaws in the current plan',
    'Enforce absolute control and eliminate resistance',
    'Ensure the safety and success of the group'
  ];
  const defaultStates = [
    'Calculating, hyper-vigilant',
    'Defiant and skeptical',
    'Methodical, ruthless',
    'Cautious, loyal'
  ];
  const defaultQuirks = [
    'Speaks with deliberate economy; measured cadence',
    'Uses dry irony and skeptical counter-questions',
    'Low, resonant delivery carrying veiled threats',
    'Speaks in rapid, clipped sentences with urgent brevity'
  ];

  return sorted.map((char, index) => {
    const role = roles[index] || 'Ally';
    const isPov = index === 0;
    const tension = role === 'Antagonist' ? 5 : role === 'Foil' ? 4 : role === 'Protagonist' ? 3 : 2;

    return {
      id: `char_${index + 1}`,
      name: char.name,
      role,
      psychologicalState: defaultStates[index] || 'Focused, observant',
      motivation: defaultMotivations[index] || 'Survive the ordeal',
      dialogueQuirks: defaultQuirks[index] || 'Measured, deliberate speech',
      tension: String(tension),
      isPov
    };
  });
}
