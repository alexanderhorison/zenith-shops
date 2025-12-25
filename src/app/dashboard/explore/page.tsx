import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Coffee Shops</h1>
        <p className="text-muted-foreground">
          Discover amazing coffee shops near you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're working on an amazing coffee shop explorer for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will help you find the perfect coffee shop based on your location, 
            preferences, and reviews from other coffee lovers.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}