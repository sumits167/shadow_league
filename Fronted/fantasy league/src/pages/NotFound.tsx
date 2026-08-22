import React from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-xl border border-border bg-card shadow-none text-center">
        <CardHeader className="space-y-3">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center border border-destructive/20">
            <AlertCircleIcon className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">404 - Page Not Found</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            The page or match record you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          <Link to="/Dashboard">
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              <ArrowLeftIcon className="mr-2 size-4" /> Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}