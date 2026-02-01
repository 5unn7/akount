import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CardWithGlow } from "@/components/ui/card-with-glow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

export default function DemoPage() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="font-heading text-4xl font-bold text-foreground">
                    Design System Demo
                </h1>
                <p className="text-muted-foreground">
                    Comprehensive showcase of all UI components with dark/light mode support
                </p>
            </div>

            <Separator />

            {/* Liquid Finance Design System Showcase */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <h2 className="font-heading text-3xl font-semibold text-foreground">
                        ✨ Liquid Finance Design System
                    </h2>
                    <p className="text-muted-foreground">
                        Glass morphism effects, cursor glow, and subtle animations
                    </p>
                </div>

                {/* Glass Effects Comparison */}
                <div>
                    <h3 className="font-heading text-xl font-semibold mb-4">
                        Glass Effects
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Static Glass Card */}
                        <Card variant="glass">
                            <CardHeader>
                                <CardTitle>Static Glass Card</CardTitle>
                                <CardDescription>
                                    Server Component with glass effect
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    This card uses the <code className="bg-muted px-1 py-0.5 rounded text-xs">variant="glass"</code> prop.
                                    It has a frosted glass appearance with backdrop blur.
                                    Perfect for static content.
                                </p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm">Backdrop Blur:</span>
                                        <span className="font-mono text-sm">6px</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Opacity:</span>
                                        <span className="font-mono text-sm">85%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">GPU Accelerated:</span>
                                        <span className="font-mono text-sm">✓</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interactive Glass Card with Glow */}
                        <CardWithGlow>
                            <CardHeader>
                                <CardTitle>Interactive Glass Card</CardTitle>
                                <CardDescription>
                                    Client Component with cursor glow
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Hover over this card!</strong> It uses the <code className="bg-muted px-1 py-0.5 rounded text-xs">CardWithGlow</code> component.
                                    Notice the orange glow that follows your cursor and the smooth lift animation.
                                </p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Cursor Tracking</Badge>
                                        <Badge variant="secondary">Lift Animation</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Orange Glow</Badge>
                                        <Badge variant="secondary">60 FPS</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </CardWithGlow>
                    </div>
                </div>

                {/* Enhanced Input Showcase */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle>Enhanced Inputs</CardTitle>
                        <CardDescription>
                            Focus glow and depth effects
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Click inside any input field to see the orange glow effect on focus.
                            Notice the subtle inner shadow that gives depth.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="demo-input-1">Invoice Amount</Label>
                                <Input
                                    id="demo-input-1"
                                    type="text"
                                    placeholder="$1,234.56"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="demo-input-2">Client Name</Label>
                                <Input
                                    id="demo-input-2"
                                    type="text"
                                    placeholder="Acme Corp"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Button Press Animation */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle>Button Press Animation</CardTitle>
                        <CardDescription>
                            Tactile feedback on click
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Click any button to feel the subtle press animation.
                            The button scales down slightly (98%) when pressed, creating a tactile feel.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button>Click Me!</Button>
                            <Button variant="secondary">Press Me!</Button>
                            <Button variant="outline">Try Me!</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Note */}
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span>⚡</span>
                            Performance Optimized
                        </CardTitle>
                        <CardDescription>
                            Single RAF loop for all cursor tracking
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            The cursor glow effect uses a global <code className="bg-muted px-1 py-0.5 rounded text-xs">CursorProvider</code> with
                            a single <code className="bg-muted px-1 py-0.5 rounded text-xs">requestAnimationFrame</code> loop.
                            This means even with 100 cards on screen, there's only one tracking loop running.
                            90% performance improvement vs per-card tracking.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-500 text-white">✓ 60 FPS</Badge>
                            <Badge className="bg-green-500 text-white">✓ No Memory Leaks</Badge>
                            <Badge className="bg-green-500 text-white">✓ GPU Accelerated</Badge>
                            <Badge className="bg-green-500 text-white">✓ SSR Safe</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Typography Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>
                        Font families and text styles
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            Headings (Newsreader)
                        </p>
                        <h1 className="font-heading text-4xl font-bold text-foreground">
                            Heading 1
                        </h1>
                        <h2 className="font-heading text-3xl font-semibold text-foreground">
                            Heading 2
                        </h2>
                        <h3 className="font-heading text-2xl font-semibold text-foreground">
                            Heading 3
                        </h3>
                        <h4 className="font-heading text-xl font-semibold text-foreground">
                            Heading 4
                        </h4>
                    </div>
                    <Separator />
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            Body Text (Manrope)
                        </p>
                        <p className="text-base text-foreground">
                            Regular body text for paragraphs and content
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Small secondary text for less important information
                        </p>
                    </div>
                    <Separator />
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            Monospace (JetBrains Mono) - Financial Data
                        </p>
                        <p className="font-mono text-lg text-foreground">
                            $12,345.67 CAD
                        </p>
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            Account #1001-2023
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Buttons Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                    <CardDescription>
                        All button variants and sizes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm font-medium mb-3">Variants</p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="default">Default (Primary)</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="link">Link</Button>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <p className="text-sm font-medium mb-3">Sizes</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm">Small</Button>
                            <Button size="default">Default</Button>
                            <Button size="lg">Large</Button>
                            <Button size="icon">🎨</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Badges</CardTitle>
                    <CardDescription>
                        Status indicators and labels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-sm font-medium mb-3">
                        Invoice Status Examples
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-500 text-white">Paid</Badge>
                        <Badge variant="secondary">Pending</Badge>
                        <Badge variant="destructive">Overdue</Badge>
                        <Badge variant="outline">Draft</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Form Elements Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>
                        Input fields and form controls
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-input">Text Input</Label>
                            <Input
                                id="text-input"
                                type="text"
                                placeholder="Enter text..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-input">Email Input</Label>
                            <Input
                                id="email-input"
                                type="email"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="number-input">Number Input</Label>
                            <Input
                                id="number-input"
                                type="number"
                                placeholder="123.45"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-input">Date Input</Label>
                            <Input id="date-input" type="date" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Submit Form</Button>
                </CardFooter>
            </Card>

            {/* Cards Variations */}
            <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                    Card Variations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Simple Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Simple Card</CardTitle>
                            <CardDescription>
                                Basic card with title and description
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This is a simple card with just content.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card with Footer */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Card with Action</CardTitle>
                            <CardDescription>
                                Card with a footer button
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Cards can have action buttons in the footer.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                View Details
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Card with Avatar */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>AK</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">
                                        John Doe
                                    </CardTitle>
                                    <CardDescription>
                                        john@example.com
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Cards can include user information.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Color Palette */}
            <Card>
                <CardHeader>
                    <CardTitle>Color Palette</CardTitle>
                    <CardDescription>
                        Semantic color tokens
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Brand Colors */}
                    <div>
                        <p className="text-sm font-medium mb-3">
                            Brand Colors (Akount)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="space-y-2">
                                <div className="h-16 bg-primary rounded border" />
                                <p className="text-xs text-muted-foreground">
                                    Primary (Orange)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-secondary rounded border" />
                                <p className="text-xs text-muted-foreground">
                                    Secondary (Violet)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-accent rounded border" />
                                <p className="text-xs text-muted-foreground">
                                    Accent
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-destructive rounded border" />
                                <p className="text-xs text-muted-foreground">
                                    Destructive
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Semantic Colors */}
                    <div>
                        <p className="text-sm font-medium mb-3">
                            Semantic Tokens
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="space-y-2">
                                <div className="h-16 bg-background border rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Background
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-card border rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Card
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-muted border rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Muted
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-popover border rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Popover
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Status Colors */}
                    <div>
                        <p className="text-sm font-medium mb-3">
                            Status Colors
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="space-y-2">
                                <div className="h-16 bg-green-500 rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Success
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-amber-500 rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Warning
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-red-500 rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Error
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 bg-blue-500 rounded" />
                                <p className="text-xs text-muted-foreground">
                                    Info
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Display Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Data Example</CardTitle>
                    <CardDescription>
                        How to display account balances
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Account Row 1 */}
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">
                                    Cash - Business Account
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Account #1001
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-lg text-foreground">
                                    $45,234.50
                                </p>
                                <Badge className="bg-green-500 text-white">
                                    Active
                                </Badge>
                            </div>
                        </div>

                        {/* Account Row 2 */}
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">
                                    Accounts Receivable
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Account #1200
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-lg text-foreground">
                                    $12,890.00
                                </p>
                                <Badge variant="secondary">Pending</Badge>
                            </div>
                        </div>

                        {/* Account Row 3 */}
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">
                                    Accounts Payable
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Account #2000
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-lg text-destructive">
                                    -$8,450.75
                                </p>
                                <Badge variant="destructive">Overdue</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Responsive Grid Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Responsive Grid</CardTitle>
                    <CardDescription>
                        Mobile-first responsive layout
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="h-24 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
                            <span className="font-mono text-sm text-primary">
                                Col 1
                            </span>
                        </div>
                        <div className="h-24 bg-secondary/10 border-2 border-secondary rounded-lg flex items-center justify-center">
                            <span className="font-mono text-sm text-secondary">
                                Col 2
                            </span>
                        </div>
                        <div className="h-24 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
                            <span className="font-mono text-sm text-primary">
                                Col 3
                            </span>
                        </div>
                        <div className="h-24 bg-secondary/10 border-2 border-secondary rounded-lg flex items-center justify-center">
                            <span className="font-mono text-sm text-secondary">
                                Col 4
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Resize your browser to see the responsive behavior: 1
                        column on mobile, 2 on tablet, 4 on desktop
                    </p>
                </CardContent>
            </Card>

            {/* Theme Toggle Instructions */}
            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span>🌓</span>
                        Try Dark Mode!
                    </CardTitle>
                    <CardDescription>
                        Click the sun/moon icon in the navbar to switch themes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        All components on this page automatically adapt to the
                        selected theme. Try switching between light and dark
                        modes to see how the design system maintains consistency
                        while providing an optimal viewing experience in both
                        modes.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Badge>✓ Semantic Tokens</Badge>
                        <Badge>✓ Brand Consistency</Badge>
                        <Badge>✓ Proper Contrast</Badge>
                        <Badge>✓ Zero Flash</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
