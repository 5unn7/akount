-- AlterTable: Add tokensUsed field to AIDecisionLog for cost attribution (P0-2)
ALTER TABLE "AIDecisionLog" ADD COLUMN "tokensUsed" INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN "AIDecisionLog"."tokensUsed" IS 'Total tokens consumed (input + output) for cost attribution';
