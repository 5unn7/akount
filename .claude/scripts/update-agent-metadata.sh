#!/bin/bash
# Script to update all review agent metadata files

AGENTS_DIR=".claude/agents/review"

echo "Updating agent metadata files..."

# Define metadata for each agent
declare -A REVIEW_TYPE
REVIEW_TYPE["architecture-strategist"]="both"
REVIEW_TYPE["kieran-typescript-reviewer"]="code"
REVIEW_TYPE["nextjs-app-router-reviewer"]="code"
REVIEW_TYPE["fastify-api-reviewer"]="code"
REVIEW_TYPE["prisma-migration-reviewer"]="code"
REVIEW_TYPE["security-sentinel"]="both"
REVIEW_TYPE["financial-data-validator"]="code"
REVIEW_TYPE["performance-oracle"]="code"
REVIEW_TYPE["code-simplicity-reviewer"]="code"
REVIEW_TYPE["design-system-enforcer"]="code"
REVIEW_TYPE["clerk-auth-reviewer"]="code"
REVIEW_TYPE["rbac-validator"]="code"
REVIEW_TYPE["data-migration-expert"]="code"
REVIEW_TYPE["deployment-verification-agent"]="code"
REVIEW_TYPE["turborepo-monorepo-reviewer"]="code"

echo "Script created. Run manually to update remaining agents."
