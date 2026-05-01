import {
	Button,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@kana-consultant/ui-kit"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { AiTab } from "~/components/settings/ai-tab"
import { BusinessTab } from "~/components/settings/business-tab"
import { EmailTab } from "~/components/settings/email-tab"
import { PipelineTab } from "~/components/settings/pipeline-tab"
import { SchedulerTab } from "~/components/settings/scheduler-tab"
import type { TabProps } from "~/components/settings/types"
import { orpc, orpcClient } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsPage,
})

function SettingsPage() {
	const queryClient = useQueryClient()
	const {
		data: settings,
		isPending,
		error,
	} = useQuery(orpc.settings.getAll.queryOptions())

	const updateBulk = useMutation({
		mutationFn: (entries: { key: string; value: any }[]) =>
			orpcClient.settings.updateBulk({ entries }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.settings.getAll.queryOptions().queryKey,
			})
		},
	})

	const [formState, setFormState] = useState<Record<string, any>>({})
	const [activeCategory, setActiveCategory] = useState("ai")

	useEffect(() => {
		if (settings) {
			const initial: Record<string, any> = {}
			for (const s of settings) {
				initial[s.key] = s.value
			}
			setFormState(initial)
		}
	}, [settings])

	if (isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-1/3 rounded-lg" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		)
	}

	if (error || !settings) {
		return (
			<div
				className="p-6 rounded-lg border text-sm"
				style={{
					borderColor: "var(--color-danger)",
					color: "var(--color-danger)",
					background:
						"color-mix(in oklab, var(--color-danger) 8%, transparent)",
				}}
			>
				Failed to load settings. Ensure the server is running.
			</div>
		)
	}

	const hasChanges = settings.some((s) => {
		const current = formState[s.key]
		const original = s.value
		if (typeof original === "object") {
			return JSON.stringify(current) !== JSON.stringify(original)
		}
		return current !== original
	})

	const handleSave = () => {
		const changedEntries = settings
			.filter((s) => {
				const current = formState[s.key]
				const original = s.value
				if (typeof original === "object") {
					return JSON.stringify(current) !== JSON.stringify(original)
				}
				return current !== original
			})
			.map((s) => ({ key: s.key, value: formState[s.key] }))

		if (changedEntries.length > 0) {
			updateBulk.mutate(changedEntries)
		}
	}

	const handleDiscard = () => {
		const initial: Record<string, any> = {}
		for (const s of settings) initial[s.key] = s.value
		setFormState(initial)
		updateBulk.reset()
	}

	const onFieldChange = (key: string, value: any) => {
		setFormState((prev) => ({ ...prev, [key]: value }))
	}

	const tabProps: TabProps = {
		settings,
		formState,
		onFieldChange,
		onSave: handleSave,
		isSaving: updateBulk.isPending,
		hasChanges,
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				<p
					className="text-sm mt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Configure AI models, prompts, email templates, and pipeline
					parameters.
				</p>
			</div>

			{/* Sticky save bar */}
			{hasChanges && (
				<div
					className="sticky top-0 z-10 flex items-center justify-between gap-3 py-3 px-4 rounded-xl border"
					style={{
						background: "var(--color-background)",
						borderColor: "var(--color-border)",
					}}
				>
					<p
						className="text-sm"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						You have unsaved changes.
					</p>
					<div className="flex items-center gap-2">
						{updateBulk.isSuccess && (
							<span
								className="text-xs font-medium px-2 py-1 rounded-md"
								style={{
									color: "var(--color-success)",
									background:
										"color-mix(in oklab, var(--color-success) 12%, transparent)",
								}}
							>
								Saved successfully
							</span>
						)}
						{updateBulk.isError && (
							<span
								className="text-xs font-medium px-2 py-1 rounded-md"
								style={{
									color: "var(--color-danger)",
									background:
										"color-mix(in oklab, var(--color-danger) 12%, transparent)",
								}}
							>
								Save failed
							</span>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDiscard}
							disabled={updateBulk.isPending}
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={updateBulk.isPending}
							leadingIcon={
								updateBulk.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)
							}
						>
							{updateBulk.isPending ? "Saving..." : "Save All Changes"}
						</Button>
					</div>
				</div>
			)}

			<Tabs value={activeCategory} onValueChange={setActiveCategory}>
				<TabsList>
					<TabsTrigger value="ai">AI Models & Prompts</TabsTrigger>
					<TabsTrigger value="email">Email</TabsTrigger>
					<TabsTrigger value="business">Business Profile</TabsTrigger>
					<TabsTrigger value="pipeline">Pipeline</TabsTrigger>
					<TabsTrigger value="scheduler">Scheduler</TabsTrigger>
				</TabsList>

				<TabsContent value="ai">
					<AiTab {...tabProps} />
				</TabsContent>
				<TabsContent value="email">
					<EmailTab {...tabProps} />
				</TabsContent>
				<TabsContent value="business">
					<BusinessTab {...tabProps} />
				</TabsContent>
				<TabsContent value="pipeline">
					<PipelineTab {...tabProps} />
				</TabsContent>
				<TabsContent value="scheduler">
					<SchedulerTab {...tabProps} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
