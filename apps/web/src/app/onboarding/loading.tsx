export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="h-10 w-10 rounded-full bg-primary/30 animate-pulse shadow-[0_0_36px_rgba(245,158,11,0.22)]" />
        <p className="text-sm text-muted-foreground font-heading italic">
          Preparing your workspace...
        </p>
      </div>
    </div>
  )
}
