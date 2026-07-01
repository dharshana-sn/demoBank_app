import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const KB_DIR = path.join(process.cwd(), 'knowledge-base');

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
    'be', 'with', 'my', 'your', 'i', 'you', 'it', 'this', 'that', 'how', 'what',
    'do', 'does', 'can', 'will', 'was', 'were', 'as', 'at', 'by', 'from', 'if',
    'not', 'no', 'me', 'about', 'want', 'need', 'please'
]);

function tokenize(text) {
    return (text.toLowerCase().match(/[a-z0-9$%]+/g) || [])
        .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// Minimal frontmatter parser matching the `key: value` / `key: [a, b]` format
// used across knowledge-base/*.md — avoids pulling in a YAML dependency.
function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };
    const [, fm, body] = match;
    const meta = {};
    fm.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
        }
        meta[key] = value;
    });
    return { meta, body };
}

// Chunk a document by its "## " sections so retrieval can point to a specific
// part of a document rather than dumping the whole file into a response.
function chunkDocument(filename, meta, body) {
    const sections = body.split(/\n(?=##\s)/g);
    return sections
        .map(section => {
            const headingMatch = section.match(/^##\s+(.+)$/m);
            const heading = headingMatch ? headingMatch[1].trim() : (meta.title || filename);
            const content = section.replace(/^##\s+.+$/m, '').trim();
            return { file: filename, docTitle: meta.title || filename, section: meta.section || '', heading, content };
        })
        .filter(c => c.content);
}

function loadChunks() {
    const files = fs.existsSync(KB_DIR) ? fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md')) : [];
    const chunks = [];
    files.forEach(filename => {
        const raw = fs.readFileSync(path.join(KB_DIR, filename), 'utf-8');
        const { meta, body } = parseFrontmatter(raw);
        chunks.push(...chunkDocument(filename, meta, body));
    });
    return chunks.map(c => ({ ...c, tokens: tokenize(`${c.docTitle} ${c.heading} ${c.content}`) }));
}

function scoreChunk(queryTokens, chunk) {
    const tokenSet = new Set(chunk.tokens);
    const headingTokens = new Set(tokenize(`${chunk.docTitle} ${chunk.heading}`));
    let score = 0;
    queryTokens.forEach(t => {
        if (tokenSet.has(t)) score += 1;
        if (headingTokens.has(t)) score += 1.5;
    });
    return score;
}

// GET /api/knowledge/search?q=...&limit=3
router.get('/search', (req, res) => {
    try {
        const q = (req.query.q || '').toString();
        const limit = Math.min(parseInt(req.query.limit, 10) || 3, 10);
        if (!q.trim()) return res.status(400).json({ error: 'q is required' });

        const queryTokens = tokenize(q);
        const results = loadChunks()
            .map(c => ({ ...c, score: scoreChunk(queryTokens, c) }))
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ tokens, ...rest }) => rest);

        res.json({ query: q, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/knowledge/topics — list of documents available for retrieval
router.get('/topics', (req, res) => {
    try {
        const chunks = loadChunks();
        const docs = {};
        chunks.forEach(c => {
            if (!docs[c.file]) docs[c.file] = { file: c.file, title: c.docTitle, section: c.section };
        });
        res.json(Object.values(docs));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
