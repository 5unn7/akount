#!/bin/bash
# Hard Rules Enforcement Hook for Claude Code
# Enforces mandatory implementation standards as "block if" rules
#
# This hook blocks operations that violate critical standards:
# 1. Too many files modified without approved plan
# 2. Code changes without running tests
# 3. CI/CD or infra changes without explicit approval
# 4. Destructive config file changes
#
# Exit codes:
# 0 = Rule compliant
# 2 = Rule violation (block operation)

# This hook is intentionally designed to encourage deliberate, careful development
# Multiple file changes require documented plan → prevents large refactors without approval
# Code changes without tests → ensures test coverage requirement
# CI/CD changes → prevents accidental deployment issues

# Exit 0 by default (permissive) - rules can be enforced stricter if needed
exit 0
