import { KNOWLEDGE_CORPUS } from '../data/knowledgeCorpus.js';

// Common conversational / non-discriminative stop words
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
  'bank', 'banks', 'banking', 'payment', 'payments', 'transaction', 'transactions', 'process', 'work', 'working'
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
 * Tokenize search text into clean keywords
 */
export function extractQueryTokens(query) {
  if (!query) return [];
  const clean = query.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  const rawTokens = clean.split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
  
  // Expand with synonyms
  const expanded = new Set(rawTokens);
  for (const token of rawTokens) {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(syn => expanded.add(syn));
    }
  }
  
  // Check for multi-word phrases (e.g. "contact vi", "tid not present", "end of day")
  for (const [phrase, synList] of Object.entries(SYNONYMS)) {
    if (phrase.includes(' ') && clean.includes(phrase)) {
      synList.forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded);
}

/**
 * Retrieve top relevant chunks from KNOWLEDGE_CORPUS for a query.
 * @param {string} query - Free-text question from cashier or merchant
 * @param {number} topK - Maximum number of chunks to return (default 8)
 * @returns {Array} Top-scoring chunks with title, source, content, and category
 */
export function retrieveRelevantChunks(query, topK = 8) {
  if (!query || typeof query !== 'string') return [];
  
  const tokens = extractQueryTokens(query);
  if (tokens.length === 0) return [];

  const rawQueryLower = query.toLowerCase();

  const scoredChunks = KNOWLEDGE_CORPUS.map(chunk => {
    let score = 0;
    const titleLower = (chunk.title || '').toLowerCase();
    const contentLower = (chunk.content || '').toLowerCase();
    const chunkKeywords = new Set(chunk.keywords || []);

    // 1. Direct title/error code substring match (+20 pts)
    if (rawQueryLower.includes(titleLower) || (titleLower.length > 4 && rawQueryLower.includes(titleLower.slice(0, 15)))) {
      score += 25;
    }

    // 2. Token-level matching
    for (const token of tokens) {
      // Title match (+10)
      if (titleLower.includes(token)) {
        score += 10;
      }
      // Chunk keywords match (+6)
      if (chunkKeywords.has(token)) {
        score += 6;
      }
      // Content body match (+2)
      if (contentLower.includes(token)) {
        score += 2;
      }
    }

    // 3. Special intent boosts
    if (tokens.some(t => ['void', 'cancel', 'refund'].includes(t)) && chunk.id.includes('void')) {
      score += 30;
    }
    if (tokens.some(t => ['emi', 'tenure'].includes(t)) && chunk.id.includes('emi')) {
      score += 30;
    }
    if (tokens.some(t => ['wifi', 'wi-fi', 'router', 'internet'].includes(t)) && (chunk.id.includes('wifi') || titleLower.includes('wifi') || titleLower.includes('2.4 ghz'))) {
      score += 30;
    }
    if (tokens.some(t => ['settle', 'batch'].includes(t)) && (chunk.id.includes('settle') || titleLower.includes('settle'))) {
      score += 30;
    }
    if (tokens.some(t => ['upi', 'qr'].includes(t)) && (chunk.id.includes('upi') || chunk.id.includes('bharat_qr'))) {
      score += 25;
    }
    if (tokens.some(t => ['dcc', 'foreign', 'conversion', 'exchange'].includes(t)) && chunk.id.includes('dcc')) {
      score += 30;
    }

    return { chunk, score };
  });

  // Filter to chunks with score >= 14 (confident match on title/intent/keywords), sort descending, and cap to topK
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

  return chunks.map((c, idx) => {
    return `[DOCUMENT CHUNK ${idx + 1}] (${c.source})\nTitle: ${c.title}\nCategory: ${c.category}\nContent:\n${c.content}\n`;
  }).join("\n---\n\n");
}
