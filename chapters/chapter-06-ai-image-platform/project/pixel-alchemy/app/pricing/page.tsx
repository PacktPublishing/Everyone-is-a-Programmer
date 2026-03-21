"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, AlertCircle, Check, Crown, Loader2, Rocket, Sparkles, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { creditPackageList, type CreditPackageId } from "@/lib/stripe/packages"

const packageIcons = {
  starter: Sparkles,
  standard: Zap,
  professional: Crown,
  enterprise: Rocket,
}

function formatPrice(unitAmount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(unitAmount / 100)
}

export default function PricingPage() {
  const [activePackageId, setActivePackageId] = useState<CreditPackageId | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCheckout = async (packageId: CreditPackageId) => {
    setErrorMessage(null)
    setActivePackageId(packageId)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      if (!session?.access_token) {
        setActivePackageId(null)
        window.location.assign("/login?redirect=/pricing")
        return
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create a checkout session.")
      }

      if (!payload.url) {
        throw new Error("Stripe did not return a checkout URL.")
      }

      window.location.assign(payload.url)
    } catch (error) {
      setActivePackageId(null)
      setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Pixel Alchemy</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to home</span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">Credit-based pricing</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Buy credits only when you need them
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
              Pixel Alchemy uses one-time credit packs instead of monthly subscriptions. Sign in, choose a pack, complete the Stripe checkout flow, and your credits are added to your account.
            </p>
          </div>

          {errorMessage && (
            <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Checkout could not be started</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {creditPackageList.map((creditPackage) => {
              const IconComponent = packageIcons[creditPackage.id]
              const isLoading = activePackageId === creditPackage.id

              return (
                <Card
                  key={creditPackage.id}
                  className={`relative border-border bg-card transition-all duration-300 hover:border-primary/50 ${
                    creditPackage.popular ? "ring-2 ring-primary/20" : ""
                  }`}
                >
                  {creditPackage.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                      Most popular
                    </Badge>
                  )}

                  <CardHeader className="pb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-card-foreground">{creditPackage.name}</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">{creditPackage.description}</CardDescription>
                    <div className="mt-6">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(creditPackage.unitAmount, creditPackage.currency)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-primary">{creditPackage.credits} credits included</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {creditPackage.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full bg-gradient-to-r from-primary to-secondary font-medium text-primary-foreground hover:from-primary/90 hover:to-secondary/90"
                      size="lg"
                      disabled={activePackageId !== null}
                      onClick={() => handleCheckout(creditPackage.id)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting to Stripe
                        </>
                      ) : (
                        creditPackage.ctaLabel
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How billing works</h2>
            <p className="mt-4 text-lg text-muted-foreground">A simple purchase flow built for on-demand image generation.</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Step 1</p>
                <h3 className="mt-3 text-lg font-semibold text-card-foreground">Choose a credit pack</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pick the package that matches your current workload. There is no recurring subscription.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Step 2</p>
                <h3 className="mt-3 text-lg font-semibold text-card-foreground">Complete secure checkout</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The pricing page requests a Stripe Checkout Session from the backend and redirects you to the hosted payment page.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Step 3</p>
                <h3 className="mt-3 text-lg font-semibold text-card-foreground">Receive credits automatically</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  After Stripe confirms the payment, the webhook updates your order and adds the purchased credits to your account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">FAQ</h2>
            <p className="mt-4 text-lg text-muted-foreground">Answers to the common billing questions for this project.</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">Do I need a subscription to use the platform?</h3>
                <p className="text-muted-foreground">
                  No. Pixel Alchemy uses one-time credit purchases. You buy a pack only when you need more generation capacity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">When will my credits appear?</h3>
                <p className="text-muted-foreground">
                  Credits are added after Stripe marks the checkout as completed and the backend webhook finishes processing the order.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">Can I purchase multiple packs?</h3>
                <p className="text-muted-foreground">
                  Yes. Each completed checkout creates a separate order and adds the matching number of credits to your account balance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
