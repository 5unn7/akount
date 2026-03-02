-- CreateTable
CREATE TABLE "OnboardingWizardState" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "stepData" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingWizardState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingWizardState_clerkUserId_key" ON "OnboardingWizardState"("clerkUserId");
