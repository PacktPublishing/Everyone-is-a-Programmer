import Link from "next/link"
import { ArrowLeft, CircleX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Card className="w-full max-w-2xl border-border bg-card text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CircleX className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-card-foreground">Checkout canceled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            No payment was completed, and no credits were added. You can return to pricing at any time and restart checkout.
          </p>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to pricing
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
