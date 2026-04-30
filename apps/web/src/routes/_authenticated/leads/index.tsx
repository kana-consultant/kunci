import { Button, Card, CardContent, Skeleton } from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"
import { orpc } from "~/libs/orpc/client"

import { columns } from "./-columns"
import { DataTable } from "./-data-table"

export const Route = createFileRoute("/_authenticated/leads/")({
  component: LeadsPage,
})

function LeadsPage() {
  const query = useQuery(
    orpc.lead.list.queryOptions({ input: { page: 1, limit: 50 } }),
  )

  const data = query.data ?? { total: 0, leads: [] }
  const leads = data.leads

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads Pipeline</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {(data.total as number) ?? 0} leads total
          </p>
        </div>
        <Link to="/capture">
          <Button leadingIcon={<UserPlus className="w-4 h-4" />}>
            Add Lead
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {query.isPending ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : query.error ? (
            <div className="p-12 text-center text-[var(--color-danger)]">
              Failed to load leads. Make sure the API server is running.
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-muted-foreground)]">
              <p className="mb-3">No leads found in the pipeline.</p>
              <Link
                to="/capture"
                className="text-[var(--color-primary)] font-medium"
              >
                Capture your first lead →
              </Link>
            </div>
          ) : (
            <DataTable columns={columns} data={leads} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
