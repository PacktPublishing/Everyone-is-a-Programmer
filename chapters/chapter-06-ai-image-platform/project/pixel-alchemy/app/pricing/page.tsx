import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Check, ArrowLeft, Zap, Crown, Rocket } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Free version",
      price: "¥0",
      period: "/moon",
      description: "Suitable for beginners and light users",
      icon: Sparkles,
      features: ["50 images generated per month", "Base AI Model", "Standard resolution (512x512)", "community support", "Basic style template"],
      buttonText: "Get started for free",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Professional version",
      price: "¥99",
      period: "/moon",
      description: "Perfect for professional creators and designers",
      icon: Zap,
      features: [
        "500 images generated per month",
        "advanced AI Model",
        "HD resolution (1024x1024)",
        "Priority customer service support",
        "All style templates",
        "Batch generation function",
        "Commercial use license",
        "No watermark output",
      ],
      buttonText: "Choose Professional Edition",
      buttonVariant: "default" as const,
      popular: true,
    },
    {
      name: "Enterprise Edition",
      price: "¥299",
      period: "/moon",
      description: "Suitable for team and enterprise use",
      icon: Crown,
      features: [
        "Unlimited image generation",
        "up to date AI Model",
        "Ultra HD resolution (2048x2048)",
        "Dedicated customer service manager",
        "Custom style training",
        "API Access",
        "Team collaboration features",
        "Data security",
        "Customized services",
      ],
      buttonText: "contact sales",
      buttonVariant: "outline" as const,
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Pixel Alchemy</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Return to home page</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Choose the one that suits you
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">creative plan</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
              Whether you're an individual creator or a corporate team, we have a pricing plan to fit your needs. start yourAIA creative journey to unleash unlimited creative potential.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.name}
                  className={`relative bg-card border-border hover:border-primary/50 transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-primary/20 scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                      most popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-card-foreground">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.buttonVariant === "default"
                          ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium"
                          : ""
                      }`}
                      variant={plan.buttonVariant}
                      size="lg"
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-32 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">FAQ</h2>
            <p className="mt-4 text-lg text-muted-foreground">FAQs about pricing and features</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Can I upgrade or downgrade my plan at any time?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time in your account settings. Upgrades take effect immediately, downgrades will take effect in the next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Are there any copyright restrictions on the generated images?</h3>
                <p className="text-muted-foreground">
                  Professional and Enterprise Edition users have full commercial use rights to generated images. Free version users are limited to personal, non-commercial use.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Will the unused quota be accumulated to the next month?</h3>
                <p className="text-muted-foreground">
                  Sorry, unused generation credits will not be rolled over to the next month. The monthly limit will reset at the beginning of a new billing cycle.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to start creating?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Register now to start yourAIImage generation journey</p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium px-8 py-3"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start for free
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                contact sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
