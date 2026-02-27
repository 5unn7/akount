# Architecture Deep-Dive: Multi-Domain Index Loading & Freshness

**Supplement to:** docs/plans/2026-02-27-code-indexing-upgrade.md
**Created:** 2026-02-27

---

## Problem Statement

### Multi-Domain Work is Common

Real-world tasks often touch multiple domains:

| Task | Domains Touched | Files Affected |
|------|-----------------|----------------|
| "Implement bank transfers" | Banking, Accounting | transfer.service.ts, journal-entry.service.ts, entry-number.ts |
| "Invoice payment matching" | Invoicing, Banking, Accounting, Clients | invoice.service.ts, payment.service.ts, account.service.ts, client.service.ts |
| "Budget vs actuals report" | Planning, Accounting | budget.service.ts, report.service.ts |
| "AI categorization rules" | AI, Banking, Accounting | categorization.service.ts, transaction.service.ts, category.service.ts |

**Challenge:** How do workflows know which domain indexes to load?

---

## Solution 1: Intelligent Multi-Domain Loading

### Strategy A: Path-Based (Automatic)

**When to use:** Agent is already working in specific files
**How it works:** Infer domains from file paths

```javascript
// Example: Editing apps/api/src/domains/banking/services/transfer.service.ts

function inferDomainsFromPaths(filePaths) {
  const domains = new Set();

  for (const path of filePaths) {
    if (path.includes('/banking/')) domains.add('banking');
    if (path.includes('/invoicing/')) domains.add('invoicing');
    if (path.includes('/accounting/')) domains.add('accounting');
    // ... check all 8 domains
  }

  return Array.from(domains);
}

// Result: ['banking']
// But banking → accounting adjacency → load both
// Final: Load CODEBASE-BANKING.md + CODEBASE-ACCOUNTING.md
```

**Pros:**
- Zero user input required
- Works for existing file edits
- Catches obvious domain context

**Cons:**
- Doesn't work for new features (no files yet)
- Might miss non-obvious cross-domain dependencies

---

### Strategy B: Adjacency-Based (Smart)

**When to use:** Domains have known relationships
**How it works:** Pre-defined adjacency matrix auto-loads related domains

**Domain Adjacency Matrix:**
```json
{
  "banking": ["accounting"],
  "invoicing": ["accounting", "clients"],
  "vendors": ["accounting"],
  "accounting": [],
  "planning": ["accounting", "banking"],
  "ai": ["banking", "accounting"],
  "web-pages": ["web-components"],
  "web-components": [],
  "packages": []
}
```

**Rationale:**
- **Banking → Accounting:** Transfers create journal entries
- **Invoicing → Accounting + Clients:** Invoice posting to GL, client data
- **Vendors → Accounting:** Bill payments create JEs
- **Planning → Accounting + Banking:** Budget vs actuals, cash flow projections
- **AI → Banking + Accounting:** Categorization rules, auto-posting

**Algorithm:**
```javascript
function loadWithAdjacency(primaryDomain) {
  const toLoad = new Set([primaryDomain]);

  // Add adjacent domains
  const adjacent = adjacencyMatrix[primaryDomain] || [];
  for (const adj of adjacent) {
    toLoad.add(adj);
  }

  return Array.from(toLoad);
}

// Example: loadWithAdjacency('banking')
// Returns: ['banking', 'accounting']
```

**Pros:**
- Proactively loads related domains
- Prevents "index not found" errors for cross-domain imports
- Token budget safe (max 3-4 domains = ~12K tokens)

**Cons:**
- Requires maintaining adjacency matrix
- Might load unnecessary domains occasionally

---

### Strategy C: Task-Based (Explicit)

**When to use:** Working from TASKS.md with domain tags
**How it works:** Read task metadata, load specified domains

**Task metadata example:**
```markdown
| ID | Task | Domain | ... |
|----|------|--------|-----|
| DEV-46 | Implement bank transfers | Banking, Accounting | ... |
```

**Algorithm:**
```javascript
function loadFromTask(taskId) {
  const task = tasksIndex[taskId];
  const domains = task.domain.split(', '); // ['Banking', 'Accounting']

  // Normalize to lowercase codes
  return domains.map(d => d.toLowerCase()); // ['banking', 'accounting']
}
```

**Pros:**
- Explicit, no guessing
- Works for planned work
- Can be enriched with task-enrichments.json

**Cons:**
- Requires tasks to have domain tags
- Doesn't work for ad-hoc exploration

---

### Strategy D: Keyword-Based (Fallback)

**When to use:** User message describes work, no files or tasks yet
**How it works:** Extract keywords, map to domains

**Keyword → Domain Mapping:**
```json
{
  "invoice": ["invoicing", "accounting"],
  "payment": ["banking", "invoicing", "accounting"],
  "transfer": ["banking", "accounting"],
  "budget": ["planning", "accounting"],
  "client": ["clients", "invoicing"],
  "vendor": ["vendors", "accounting"],
  "categorization": ["ai", "banking", "accounting"],
  "journal": ["accounting"],
  "GL": ["accounting"],
  "chart of accounts": ["accounting"]
}
```

**Algorithm:**
```javascript
function inferDomainsFromKeywords(text) {
  const domains = new Set();
  const lowerText = text.toLowerCase();

  for (const [keyword, relatedDomains] of Object.entries(keywordMap)) {
    if (lowerText.includes(keyword)) {
      for (const domain of relatedDomains) {
        domains.add(domain);
      }
    }
  }

  return Array.from(domains);
}

// Example: "Implement invoice payment matching"
// Matches: invoice → [invoicing, accounting], payment → [banking, invoicing, accounting]
// Result: ['invoicing', 'accounting', 'banking']
```

**Pros:**
- Works for natural language requests
- No prior context needed
- Catches intent from user messages

**Cons:**
- Keyword extraction can be noisy
- Might load too many domains
- Requires maintaining keyword map

---

### Combined Strategy (Recommended)

Use all 4 strategies in priority order:

```javascript
function loadRelevantIndexes({ filePaths, taskId, keywords }) {
  let domains = new Set();

  // 1. Path-based (highest confidence)
  if (filePaths && filePaths.length > 0) {
    const pathDomains = inferDomainsFromPaths(filePaths);
    pathDomains.forEach(d => domains.add(d));
  }

  // 2. Task-based (explicit)
  if (taskId) {
    const taskDomains = loadFromTask(taskId);
    taskDomains.forEach(d => domains.add(d));
  }

  // 3. Keyword-based (fallback)
  if (domains.size === 0 && keywords) {
    const keywordDomains = inferDomainsFromKeywords(keywords);
    keywordDomains.forEach(d => domains.add(d));
  }

  // 4. Adjacency expansion
  const withAdjacency = new Set(domains);
  for (const domain of domains) {
    const adjacent = adjacencyMatrix[domain] || [];
    adjacent.forEach(adj => withAdjacency.add(adj));
  }

  // 5. Safety limit (max 4 domains = ~12K tokens)
  const finalDomains = Array.from(withAdjacency).slice(0, 4);

  // 6. Load indexes
  const indexes = {};
  for (const domain of finalDomains) {
    const indexPath = `CODEBASE-${domain.toUpperCase()}.md`;
    indexes[domain] = loadIndex(indexPath);
  }

  return indexes;
}
```

**Example Flow:**

```
User: "Implement bank transfers with GL posting"

1. Path-based: No files yet → skip
2. Task-based: No task ID provided → skip
3. Keyword-based: Matches "transfer" → [banking, accounting], "GL" → [accounting]
   → domains = ['banking', 'accounting']
4. Adjacency: banking → [accounting] (already included)
   → domains = ['banking', 'accounting']
5. Safety limit: 2 domains < 4 max → OK
6. Load: CODEBASE-BANKING.md + CODEBASE-ACCOUNTING.md
   → ~6,320 tokens

Result: Agent has context for both transfer logic and journal entry creation
```

---

## Solution 2: Index Freshness System

### Problem: Stale Indexes

**Scenarios:**
1. **Developer commits TS files, forgets to rebuild index**
2. **Multiple agents working in parallel, race condition on rebuild**
3. **Index rebuilt but file modified after rebuild (time gap)**
4. **Git branch switch changes files, index out of sync**

**Impact:**
- Agent looks up non-existent file in index
- Agent misses newly created files
- Pattern violations not detected (index doesn't know about new violations)

---

### Solution: Freshness State Tracking

**State File:** `.claude/.code-index-state.json`

```json
{
  "lastBuild": "2026-02-27T21:30:00.000Z",
  "gitCommit": "abc1234",
  "gitBranch": "main",
  "domains": {
    "banking": {
      "lastBuild": "2026-02-27T21:30:00.000Z",
      "fileCount": 80,
      "newestFile": "transfer.service.ts",
      "newestMtime": "2026-02-27T20:15:00.000Z",
      "indexFile": "CODEBASE-BANKING.md",
      "indexSize": 3245
    },
    "invoicing": {
      "lastBuild": "2026-02-27T21:28:00.000Z",
      "fileCount": 85,
      "newestFile": "invoice.service.ts",
      "newestMtime": "2026-02-27T21:25:00.000Z",
      "indexFile": "CODEBASE-INVOICING.md",
      "indexSize": 3412
    }
  }
}
```

**Staleness Detection:**

```javascript
function isDomainIndexStale(domain) {
  const state = loadIndexState();
  const domainState = state.domains[domain];

  if (!domainState) return true; // No state = stale

  // Check 1: Has git commit changed?
  const currentCommit = execSync('git rev-parse HEAD').toString().trim();
  if (currentCommit !== state.gitCommit) {
    return true; // Different commit = likely stale
  }

  // Check 2: Are there newer files than index build?
  const domainFiles = glob(`apps/api/src/domains/${domain}/**/*.ts`);
  for (const file of domainFiles) {
    const mtime = fs.statSync(file).mtime;
    if (mtime > new Date(domainState.lastBuild)) {
      return true; // File modified after index build
    }
  }

  // Check 3: Has file count changed?
  if (domainFiles.length !== domainState.fileCount) {
    return true; // Files added/removed
  }

  return false; // Fresh!
}
```

**Auto-Rebuild Strategy:**

```bash
# Post-commit hook (.claude/hooks/rebuild-code-index.sh)

#!/bin/bash

# Get changed files
CHANGED=$(git diff --name-only HEAD~1 HEAD | grep '\.tsx\?$')

if [ -z "$CHANGED" ]; then
  exit 0 # No TS files changed
fi

# Determine affected domains
DOMAINS=""
for file in $CHANGED; do
  case $file in
    *"/banking/"*) DOMAINS="$DOMAINS banking" ;;
    *"/invoicing/"*) DOMAINS="$DOMAINS invoicing" ;;
    *"/accounting/"*) DOMAINS="$DOMAINS accounting" ;;
    *"/planning/"*) DOMAINS="$DOMAINS planning" ;;
    *"/ai/"*) DOMAINS="$DOMAINS ai" ;;
    *"/app/"*) DOMAINS="$DOMAINS web-pages" ;;
    *"/components/"*) DOMAINS="$DOMAINS web-components" ;;
    *"packages/"*) DOMAINS="$DOMAINS packages" ;;
  esac
done

# Remove duplicates
DOMAINS=$(echo $DOMAINS | tr ' ' '\n' | sort -u | tr '\n' ' ')

# Rebuild only affected domains
echo "Rebuilding indexes for domains: $DOMAINS"
node .claude/scripts/regenerate-code-index.js --domains "$DOMAINS"

# Update freshness state
node .claude/scripts/update-index-state.js
```

**Performance:**
- Rebuild 1 domain (~80 files): ~2 seconds
- Rebuild 3 domains (~240 files): ~5 seconds
- Rebuild all 8 domains: ~10 seconds (rare)

**Async Option:**
```bash
# Run rebuild in background (doesn't block commit)
node .claude/scripts/regenerate-code-index.js --domains "$DOMAINS" &
```

---

### Manual Rebuild Commands

**Force rebuild all:**
```bash
node .claude/scripts/regenerate-code-index.js --force
```

**Rebuild specific domains:**
```bash
node .claude/scripts/regenerate-code-index.js --domains "banking invoicing"
```

**Check staleness:**
```bash
node .claude/scripts/check-index-freshness.js

# Output:
# ✅ banking: Fresh (built 2m ago)
# ✅ invoicing: Fresh (built 2m ago)
# ❌ accounting: STALE (built 3h ago, files modified 1h ago)
# Run: node .claude/scripts/regenerate-code-index.js --domains "accounting"
```

---

### Workflow Integration

**At session start (/processes:begin):**

```javascript
// Check index freshness
const stale = checkStaleDomains();

if (stale.length > 0) {
  console.warn(`⚠️  Stale indexes: ${stale.join(', ')}`);
  console.warn(`Run: node .claude/scripts/regenerate-code-index.js --domains "${stale.join(' ')}"`);
}
```

**Before loading indexes:**

```javascript
function loadRelevantIndexes({ domains }) {
  for (const domain of domains) {
    if (isDomainIndexStale(domain)) {
      console.warn(`⚠️  ${domain} index is stale, results may be incomplete`);
      console.warn(`Recommend rebuilding: node .claude/scripts/regenerate-code-index.js --domains "${domain}"`);
    }
  }

  // Load anyway (workflow continues with warning)
  return loadIndexes(domains);
}
```

---

## Edge Cases & Solutions

### Edge Case 1: Agent Working Across 5+ Domains

**Problem:** Budget overflow (5 domains × 3,160 tokens = 15,800 tokens)

**Solution:**
- Limit to 4 domains max (~12K tokens)
- Prioritize by relevance (path-based > task-based > keyword-based)
- Warn user if domains truncated

---

### Edge Case 2: Index Missing (First-Time Setup)

**Problem:** Indexes don't exist yet, workflow fails

**Solution:**
- Detect missing indexes on first load
- Auto-run `regenerate-code-index.js --force`
- Cache result, continue workflow

---

### Edge Case 3: Git Branch Switch

**Problem:** Switched from `main` to `feature/transfers`, files different

**Solution:**
- Track git branch in index state
- Detect branch change on load
- Auto-rebuild if branch mismatch

---

### Edge Case 4: Parallel Agent Execution

**Problem:** Two agents rebuild same domain simultaneously (race condition)

**Solution:**
- File lock during rebuild (`.code-index.lock`)
- Second agent waits or skips rebuild (use existing)

---

## Token Budget Analysis (Semi-Compressed Format)

**SPIKE 2 Result:** Semi-compressed format chosen (10,150 tokens/domain, export names visible)

### Typical Case: 2 Domains Loaded

```
2 domains × 10,150 tokens/domain = 20,300 tokens
+ Workflow context (~5K tokens)
+ Task context (~2K tokens)
+ MEMORY.md (~2K tokens)
= ~29,300 tokens total

Budget: 1M tokens
Usage: 2.93% (excellent)
```

### Complex Case: 3 Domains Loaded (Safety Limit)

```
3 domains × 10,150 tokens/domain = 30,450 tokens
+ Workflow context (~5K tokens)
+ Task context (~2K tokens)
+ MEMORY.md (~2K tokens)
= ~39,450 tokens total

Budget: 1M tokens
Usage: 3.95% (acceptable)
```

### Comparison: Fully Compressed vs Semi-Compressed

| Scenario | Fully Compressed | Semi-Compressed | Impact |
|----------|------------------|-----------------|--------|
| **1 domain** | 3,160 tokens | 10,150 tokens | 3.2x larger |
| **2 domains** | 6,320 tokens | 20,300 tokens | 3.2x larger |
| **Max domains** | 6 domains (18,960) | 3 domains (30,450) | Half capacity |
| **Hallucination prevention** | Low (counts) | **High (names)** | Worth it ✅ |

**Trade-off accepted:** Quality (hallucination prevention) > quantity (domain count)

---

## Implementation Checklist

- [ ] Build domain adjacency matrix (.claude/domain-adjacency.json)
- [ ] Build multi-domain loader (load-code-index.js)
- [ ] Add freshness state tracking (.code-index-state.json)
- [ ] Build staleness checker (check-index-freshness.js)
- [ ] Add post-commit hook (rebuild-code-index.sh)
- [ ] Update workflows to use multi-domain loader
- [ ] Add staleness warning to /processes:begin
- [ ] Test with multi-domain scenarios (transfers, invoice payments)
- [ ] Document keyword map for common tasks

---

_Architecture design: 2026-02-27. Multi-domain loading + freshness system._
