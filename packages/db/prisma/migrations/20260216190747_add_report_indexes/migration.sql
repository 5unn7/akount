-- Phase 5: Add composite indexes for report query performance
-- FIXED: Removed references to deletedAt columns that don't exist in earlier migrations
-- Those indexes are already defined in schema.prisma and will be added via next migration

-- This migration is now a no-op to unblock migration chain
-- The actual indexes are defined in schema.prisma and Prisma will handle them
