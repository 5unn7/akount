# MCP Servers Configuration

## Current Setup

### context7 (Primary Documentation Server)

**URL:** `https://mcp.context7.com/mcp`

**Coverage:** 100+ frameworks including:
- Next.js (including App Router patterns)
- React (Server/Client components)
- Prisma (ORM, schema, migrations)
- TypeScript (types, patterns)
- Fastify (API patterns)
- Clerk (authentication)
- And many more...

**Why Context7 is Sufficient:**

Context7 provides unified access to documentation across all major frameworks we use. Adding framework-specific MCP servers would:
1. **Duplicate functionality** - Context7 already has Next.js, Prisma, etc.
2. **Add complexity** - More servers to configure and maintain
3. **Slow down queries** - Multiple round trips to different servers
4. **Increase failure points** - Each server is a potential point of failure

**Decision:** Use Context7 as our primary (and only) MCP server for now.

---

## When to Add More MCP Servers

Consider adding specialized MCP servers if:

1. **Domain-Specific Knowledge Needed**
   - Accounting standards (GAAP, IFRS)
   - Canadian tax regulations (CRA)
   - Industry-specific documentation

2. **Private Documentation**
   - Internal company wikis
   - Private API documentation
   - Team knowledge bases

3. **Performance Issues**
   - Context7 becomes too slow
   - Need faster specialized queries
   - High-frequency lookups for specific framework

4. **Context7 Gaps**
   - Framework not covered by Context7
   - Documentation quality insufficient
   - Missing specific version support

---

## Available MCP Server Types

### 1. HTTP-based MCP Servers

Connect to remote servers via HTTP:

```json
{
  "serverName": {
    "type": "http",
    "url": "https://example.com/mcp",
    "description": "Server description"
  }
}
```

**Pros:** No local setup, always up-to-date
**Cons:** Requires internet, potential latency

### 2. Local MCP Servers

Run locally as processes:

```json
{
  "serverName": {
    "type": "stdio",
    "command": "node",
    "args": ["path/to/server.js"],
    "description": "Server description"
  }
}
```

**Pros:** Fast, works offline, customizable
**Cons:** Requires setup, manual updates

---

## Potential Future MCP Servers

### Accounting & Tax Documentation

If available, these would be valuable additions:

- **Canadian Tax Server** - CRA regulations, tax forms, filing requirements
- **GAAP/IFRS Server** - Accounting standards documentation
- **Bookkeeping Server** - Double-entry bookkeeping best practices

### Framework-Specific (If Context7 Insufficient)

Only add if Context7 doesn't provide adequate coverage:

- **Prisma Official Docs** - If we need deeper Prisma schema patterns
- **Next.js Official Docs** - If we need latest experimental features
- **Clerk Official Docs** - If authentication patterns need more depth

### Development Tools

Could enhance development experience:

- **Git MCP Server** - Advanced git workflows, rebase strategies
- **PostgreSQL MCP Server** - Database optimization, query patterns
- **Docker MCP Server** - Container configuration, deployment

---

## Testing New MCP Servers

Before adding a new MCP server:

1. **Verify URL/Command**
   ```bash
   # For HTTP servers
   curl https://example.com/mcp

   # For local servers
   node path/to/server.js
   ```

2. **Test in settings.local.json**
   Add server to `.mcp.json` temporarily

3. **Query from Claude**
   Ask Claude to query the new server for documentation

4. **Compare with Context7**
   Is the new server better/faster/more accurate than Context7?

5. **Document Decision**
   Update this file with rationale for adding/not adding

---

## Troubleshooting

### MCP Server Not Responding

**Symptoms:** Claude says "MCP server unavailable" or queries timeout

**Solutions:**
1. Check internet connectivity (for HTTP servers)
2. Verify URL is correct: `curl <mcp-url>`
3. Check server status (may be down temporarily)
4. Try removing and re-adding server to `.mcp.json`
5. Check Claude Code logs for detailed errors

### Slow MCP Queries

**Symptoms:** Documentation queries take >5 seconds

**Solutions:**
1. Check network latency to MCP server
2. Try more specific queries (less to process)
3. Consider caching frequently-accessed docs locally
4. Contact MCP server provider about performance

### Wrong Documentation Returned

**Symptoms:** Query returns docs for wrong framework version

**Solutions:**
1. Be more specific in queries (include version numbers)
2. Check if MCP server supports version selection
3. Try querying Context7 with explicit library ID (e.g., `/nextjs/v14`)

---

## Related Files

- `.mcp.json` - MCP server configuration
- `.claude/settings.local.json` - Claude Code settings (enables MCP servers)
- `.claude/CONFIGURATION-GUIDE.md` - Complete configuration documentation

---

## Last Updated

**Date:** 2026-01-31
**Reason:** Initial documentation after configuration audit
**Decision:** Keep Context7 as sole MCP server (sufficient for current needs)
