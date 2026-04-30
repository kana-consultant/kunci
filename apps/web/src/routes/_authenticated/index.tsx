import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  StatCard,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Mail, MessageCircle, TrendingUp, Users } from "lucide-react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
})

function DashboardPage() {
  const query = useQuery(orpc.campaign.getStats.queryOptions())
  const stats = query.data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Overview of your AI SDR campaigns.
        </p>
      </div>

      {query.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : query.error ? (
        <Card>
          <CardContent className="p-4 text-[var(--color-danger)]">
            Failed to load dashboard stats. Make sure the API server is running.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            id="totalLeads"
            label="Total Leads"
            value={stats?.totalLeads ?? 0}
            icon={Users}
            tone="primary"
          />
          <StatCard
            id="awaiting"
            label="Awaiting Reply"
            value={stats?.awaiting ?? 0}
            icon={Mail}
            tone="warning"
          />
          <StatCard
            id="replied"
            label="Replied"
            value={stats?.replied ?? 0}
            icon={MessageCircle}
            tone="success"
          />
          <StatCard
            id="conversion"
            label="Conversion Rate"
            value={`${stats?.conversionRate ?? 0}%`}
            icon={TrendingUp}
            tone="accent"
          />
        </div>
      )}

      {/* Pipeline overview */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {[
              "Capture Lead",
              "Research Company",
              "AI Analysis",
              "Generate 3-Email Sequence",
              "Auto-Send",
              "Follow-Up",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <Badge tone="primary">
                  {i + 1}. {step}
                </Badge>
                {i < 5 && (
                  <span className="text-[var(--color-muted-foreground)]">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
