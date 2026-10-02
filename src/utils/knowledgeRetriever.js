import { KNOWLEDGE_CORPUS } from '../data/knowledgeCorpus.js';

// Common conversational / non-discriminative stop words
// "transaction" and "transactions" REMOVED — meaningful domain words in payment POS app
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'please', 'help', 'tell', 'want', 'need', 'know', 'pineshield', 'pos',
  'bank', 'banks', 'banking', 'payment', 'payments', 'process', 'work', 'working'
]);

// Semantic keyword synonyms for natural paraphrasing
const SYNONYMS = {
  'cancel': ['void', 'reversal', 'undo'],
  'cancellation': ['void', 'reversal'],
  'refund': ['void', 'reversal', 'reversal transaction'],
  'undo': ['void', 'cancel'],
  'internet': ['wifi', 'wi-fi', 'network', 'connection', 'offline'],
  'router': ['wifi', 'wi-fi', '2.4ghz', '5g', 'extender'],
  'network': ['wifi', 'wi-fi', 'connection'],
  'connect': ['wifi', 'wi-fi', 'activate'],
  'offline': ['wifi', 'wi-fi', 'connection', 'set connection'],
  'installment': ['emi', 'bank emi', 'tenure'],
  'loan': ['emi', 'bank emi'],
  'split': ['emi', 'tenure'],
  'tenor': ['tenure', 'emi'],
  'close': ['settle', 'settlement', 'batch', 'eod'],
  'closing': ['settle', 'settlement', 'batch'],
  'end of day': ['settle', 'settlement', 'batch'],
  'day end': ['settle', 'settlement', 'batch'],
  'foreign': ['dcc', 'currency', 'international'],
  'usd': ['dcc', 'currency', 'international'],
  'nfc': ['tap', 'contactless'],
  'contactless': ['tap', 'nfc'],
  'scan': ['upi', 'bharat qr', 'qr'],
  'tamper': ['alert erruption', 'hardware replacement'],
  'lock': ['alert erruption', 'llt mode']
};

/**
 * Basic word stemming helper for singular/plural matching
 */
export function getStem(word) {
  if (!word) return '';
  const w = word.toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 3) return w.slice(0, -2);
  if (w.endsWith('s') && w.length > 2) return w.slice(0, -1);
  return w;
}

/**
 * Tokenize search text into non-stop raw keywords
 */
export function extractRawTokens(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  return clean.split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Expand a root token into its synonym/stem family
 */
export function getTokenFamily(root) {
  const stem = getStem(root);
  const family = new Set([root, stem]);
  
  if (SYNONYMS[root]) {
    SYNONYMS[root].forEach(s => {
      family.add(s.toLowerCase());
      family.add(getStem(s.toLowerCase()));
    });
  }
  
  for (const [key, synList] of Object.entries(SYNONYMS)) {
    if (key.toLowerCase() === root || getStem(key.toLowerCase()) === stem || synList.some(s => s.toLowerCase() === root || getStem(s.toLowerCase()) === stem)) {
      family.add(key.toLowerCase());
      family.add(getStem(key.toLowerCase()));
      synList.forEach(s => {
        family.add(s.toLowerCase());
        family.add(getStem(s.toLowerCase()));
      });
    }
  }
  return family;
}

/**
 * Check if the query matches an exact multi-word phrase in the chunk
 */
export function checkPhraseMatch(rawQueryLower, rawTokens, chunk) {
  const titleLower = (chunk.title || '').toLowerCase();
  const chunkKeywords = new Set((chunk.keywords || []).map(k => k.toLowerCase()));

  // 1. Direct multi-word title in query (at least 2 non-stop words and > 5 chars)
  const titleWords = titleLower.split(/\s+/).filter(w => !STOP_WORDS.has(w));
  if (titleWords.length >= 2 && rawQueryLower.includes(titleLower)) {
    return true;
  }

  // 2. Meaningful domain bigrams / trigrams from raw non-stop query tokens
  // e.g. "sale transaction", "check balance", "print receipt", "settle batch"
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const bigram = `${rawTokens[i]} ${rawTokens[i + 1]}`;
    const bigramStemmed = `${getStem(rawTokens[i])} ${getStem(rawTokens[i + 1])}`;
    if (titleLower.includes(bigram) || titleLower.includes(bigramStemmed) || chunkKeywords.has(bigram) || chunkKeywords.has(bigramStemmed)) {
      return true;
    }
    if (i < rawTokens.length - 2) {
      const trigram = `${rawTokens[i]} ${rawTokens[i + 1]} ${rawTokens[i + 2]}`;
      if (titleLower.includes(trigram) || chunkKeywords.has(trigram)) {
        return true;
      }
    }
  }

  // 3. Multi-word phrase from SYNONYMS (e.g. "end of day", "bank emi")
  for (const phrase of Object.keys(SYNONYMS)) {
    if (phrase.includes(' ') && rawQueryLower.includes(phrase)) {
      if (titleLower.includes(phrase) || (chunk.id && chunk.id.includes(phrase.replace(/\s+/g, '_')))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Tokenize search text into expanded keywords (backward compatibility)
 */
export function extractQueryTokens(query) {
  if (!query) return [];
  const rawTokens = extractRawTokens(query);
  const expanded = new Set(rawTokens);

  for (const token of rawTokens) {
    const family = getTokenFamily(token);
    family.forEach(w => expanded.add(w));
  }

  const clean = query.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  for (const [phrase, synList] of Object.entries(SYNONYMS)) {
    if (phrase.includes(' ') && clean.includes(phrase)) {
      synList.forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded);
}

/**
 * Retrieve top relevant chunks from KNOWLEDGE_CORPUS for a query.
 * Enforces confidence tiers:
 * - HIGH confidence: (score >= 25 AND (matchedRootsCount >= 2 OR isPhrase OR hasSpecialIntent))
 * - LOW confidence: (score 14-24, or single generic token match)
 * 
 * @param {string} query - Free-text question from cashier or merchant
 * @param {number} topK - Maximum number of chunks to return (default 8)
 * @returns {Array} Top-scoring chunks annotated with confidence ('HIGH' | 'LOW')
 */
export function retrieveRelevantChunks(query, topK = 8) {
  if (!query || typeof query !== 'string') return [];
  
  const rawTokens = extractRawTokens(query);
  if (rawTokens.length === 0) return [];

  const rawQueryLower = query.toLowerCase();
  const distinctRoots = Array.from(new Set(rawTokens.map(t => getStem(t))));
  const rootFamilies = distinctRoots.map(r => ({ root: r, family: getTokenFamily(r) }));

  const scoredChunks = KNOWLEDGE_CORPUS.map(chunk => {
    let score = 0;
    const titleLower = (chunk.title || '').toLowerCase();
    const contentLower = (chunk.content || '').toLowerCase();
    const chunkKeywords = new Set((chunk.keywords || []).map(k => k.toLowerCase()));

    // 1. Exact phrase match boost (+25 pts)
    const isPhrase = checkPhraseMatch(rawQueryLower, rawTokens, chunk);
    if (isPhrase) {
      score += 25;
    }

    // 2. Direct title / error code substring match (+25 pts)
    if (rawQueryLower.includes(titleLower) || (titleLower.length > 4 && rawQueryLower.includes(titleLower.slice(0, 15)))) {
      score += 25;
    }

    // 3. Distinct root token-level matching
    let matchedRootsCount = 0;
    for (const { root, family } of rootFamilies) {
      let rootMatched = false;
      for (const word of family) {
        let wordHit = false;
        if (titleLower.includes(word)) {
          score += 10;
          wordHit = true;
        }
        if (chunkKeywords.has(word)) {
          score += 6;
          wordHit = true;
        }
        if (contentLower.includes(word)) {
          score += 2;
          wordHit = true;
        }
        if (wordHit) rootMatched = true;
      }
      if (rootMatched) {
        matchedRootsCount++;
      }
    }

    // 4. Special intent boosts
    let hasSpecialIntent = false;
    if (rawTokens.some(t => ['void', 'cancel', 'refund'].includes(t)) && chunk.id && chunk.id.includes('void')) {
      score += 30;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['emi', 'tenure'].includes(t)) && chunk.id && chunk.id.includes('emi')) {
      score += 30;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['wifi', 'router', 'internet'].includes(getStem(t))) && (chunk.id && chunk.id.includes('wifi') || titleLower.includes('wifi') || titleLower.includes('2.4 ghz'))) {
      score += 30;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['settle', 'batch'].includes(getStem(t))) && (chunk.id && chunk.id.includes('settle') || titleLower.includes('settle'))) {
      score += 30;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['upi', 'qr'].includes(t)) && (chunk.id && (chunk.id.includes('upi') || chunk.id.includes('bharat_qr')))) {
      score += 25;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['dcc', 'foreign', 'conversion', 'exchange'].includes(t)) && chunk.id && chunk.id.includes('dcc')) {
      score += 30;
      hasSpecialIntent = true;
    }
    if (rawTokens.some(t => ['sale'].includes(getStem(t))) && (rawTokens.some(t => ['transaction', 'process', 'do', 'standard'].includes(getStem(t))) || isPhrase) && chunk.id && chunk.id.includes('sale_transaction')) {
      score += 30;
      hasSpecialIntent = true;
    }

    // 5. Determine Confidence Tier
    // HIGH confidence: Strong multi-signal match (score >= 25 AND (>=2 distinct root tokens OR phrase match OR intent boost))
    // LOW confidence: Score 14-24 or matched only via a single weak generic token
    let confidence = 'NONE';
    if (score >= 25 && (matchedRootsCount >= 2 || isPhrase || hasSpecialIntent)) {
      confidence = 'HIGH';
    } else if (score >= 14) {
      confidence = 'LOW';
    }

    return {
      chunk: {
        ...chunk,
        confidence,
        score,
        matchedRootsCount,
        isPhrase
      },
      score,
      confidence
    };
  });

  // Filter to chunks with score >= 14, sort descending, and return up to topK
  const relevant = scoredChunks
    .filter(item => item.score >= 14)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);

  return relevant;
}

/**
 * Format retrieved chunks into clean markdown context for Gemini system prompt
 */
export function formatGroundingContext(chunks) {
  if (!chunks || chunks.length === 0) {
    return "No internal Pine Labs documentation chunks found matching this query.";
  }

  const highConfidenceChunks = chunks.filter(c => c.confidence === 'HIGH');
  if (highConfidenceChunks.length === 0) {
    return "No high-confidence internal Pine Labs documentation chunks found matching this query. (Retrieved partial matches are low-confidence / uncertain: do NOT present them as definitive internal SOPs. Fall back to general payments/POS knowledge with disclaimer prefix).";
  }

  return highConfidenceChunks.map((c, idx) => {
    return `[DOCUMENT CHUNK ${idx + 1}] [HIGH CONFIDENCE INTERNAL SOP] (${c.source})\nTitle: ${c.title}\nCategory: ${c.category}\nContent:\n${c.content}\n`;
  }).join("\n---\n\n");
}

