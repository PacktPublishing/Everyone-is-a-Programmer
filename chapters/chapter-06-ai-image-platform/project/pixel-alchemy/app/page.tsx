"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sparkles, Palette, Zap, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Pixel Alchemy</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
                >
                  Function
                </button>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium"
                >
                  Free registration
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-6 mt-6">
                    <div className="flex items-center space-x-2 pb-4 border-b border-border">
                      <Sparkles className="h-6 w-6 text-primary" />
                      <span className="text-lg font-semibold text-foreground">Pixel Alchemy</span>
                    </div>

                    <div className="flex flex-col space-y-4">
                      <button
                        onClick={() => scrollToSection("features")}
                        className="text-left text-foreground hover:text-primary px-3 py-2 text-base font-medium transition-colors"
                      >
                        Features
                      </button>
                      <Link
                        href="/pricing"
                        className="text-foreground hover:text-primary px-3 py-2 text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Pricing plan
                      </Link>
                    </div>

                    <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Login account
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium">
                          Free registration
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
              use your imagination,
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Refined into visual gold
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
              With the help of advancedAITechnology that transforms written description into stunning visual art. Whether it's concept design, illustration creation or brand vision, let your creativity blossom here.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium px-8 py-3 text-lg"
                >
                  Start creating for free
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg bg-transparent"
                onClick={() => scrollToSection("gallery")}
              >
                View work display
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Powerful functions to unleash creative potential</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for creatorsAIImage generation tool to make every idea perfectly presented
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Infinitely creative Wensheng pictures</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Just enter a text description,AIYou can generate high-quality original images. Supports a variety of art styles, from realistic to abstract, to meet various creative needs.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mb-6">
                  <Palette className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Amazing character consistency</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Maintain the consistency of characters in different scenes, perfect for story creation, brand image design and series illustration production.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-6">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">One-click smart style migration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Easily convert existing images into different art styles, from classical oil paintings to modern digital art, creative transformation takes just one click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 sm:py-32 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">AIDisplay of creative works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore byPixel AlchemyThe exquisite works generated, feelAIUnlimited creative possibilities
            </p>
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            <div className="break-inside-avoid">
              <img
                src="/cyberpunk-cityscape-neon.png"
                alt="AIGenerative futuristic cityscape"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/ethereal-fantasy-forest-with-magical-creatures.png"
                alt="AIGenerated fantasy forest scene"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/vibrant-abstract-digital-art.png"
                alt="AIGenerative abstract digital art"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/portrait-of-a-character-in-anime-style.png"
                alt="AIGenerated anime style character portraits"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/steampunk-mechanical-dragon.png"
                alt="AIGenerated steampunk mechanical dragon"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/minimalist-geometric-composition.png"
                alt="AIGenerated minimalist geometric composition"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/floating-islands-dreamscape.png"
                alt="AIGenerated surreal dreamscape"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="break-inside-avoid">
              <img
                src="/vintage-poster-design-with-retro-aesthetics.png"
                alt="AIGenerated retro poster design"
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium px-8 py-3"
              >
                Start creating now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">Pixel Alchemy</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                privacy policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact us
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 Pixel Alchemy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
