import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@kana-consultant/ui-kit"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
	FileText,
	Link as LinkIcon,
	Loader2,
	Paperclip,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react"
import { useRef, useState } from "react"
import { orpc } from "~/libs/orpc/client"

const KEY_MODE = "business.company_profile_mode"
const KEY_URL = "business.company_profile_url"
const KEY_FILE = "business.company_profile_file"

type Mode = "disabled" | "url" | "file"

interface FileMeta {
	storageKey: string
	fileName: string
	mime: string
	size: number
	uploadedAt: string
}

interface Props {
	formState: Record<string, any>
	onFieldChange: (key: string, value: any) => void
}

const ACCEPT =
	".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"

const MAX_BYTES = 10 * 1024 * 1024

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
	return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function MimeIcon({ mime }: { mime: string }) {
	if (mime === "application/pdf") {
		return (
			<span
				className="size-9 rounded-lg flex items-center justify-center"
				style={{
					background: "color-mix(in oklab, var(--color-danger) 14%, transparent)",
					color: "var(--color-danger)",
				}}
			>
				<FileText className="size-4" />
			</span>
		)
	}
	return (
		<span
			className="size-9 rounded-lg flex items-center justify-center"
			style={{
				background: "color-mix(in oklab, var(--color-info) 14%, transparent)",
				color: "var(--color-info)",
			}}
		>
			<FileText className="size-4" />
		</span>
	)
}

export function CompanyProfileSection({ formState, onFieldChange }: Props) {
	const queryClient = useQueryClient()
	const mode = (formState[KEY_MODE] as Mode | undefined) ?? "disabled"
	const url = (formState[KEY_URL] as string | undefined) ?? ""
	const file = (formState[KEY_FILE] as FileMeta | null | undefined) ?? null

	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const refreshSettings = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.settings.getAll.queryOptions().queryKey,
		})

	const uploadMutation = useMutation({
		mutationFn: async (chosen: File) => {
			if (chosen.size > MAX_BYTES) {
				throw new Error(
					`File exceeds ${formatBytes(MAX_BYTES)} (got ${formatBytes(chosen.size)})`,
				)
			}
			const form = new FormData()
			form.append("file", chosen)
			const res = await fetch("/api/uploads/company-profile", {
				method: "POST",
				body: form,
				credentials: "include",
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.error || `Upload failed (${res.status})`)
			}
			return res.json() as Promise<{ ok: true; file: FileMeta }>
		},
		onSuccess: async (data) => {
			setUploadError(null)
			// Reflect the upload locally so the user sees it without a full refetch
			// roundtrip — the next getAll() will confirm.
			onFieldChange(KEY_FILE, data.file)
			if (mode === "disabled") onFieldChange(KEY_MODE, "file")
			await refreshSettings()
		},
		onError: (err: any) => {
			setUploadError(err?.message ?? "Upload failed")
		},
	})

	const clearMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/uploads/company-profile", {
				method: "DELETE",
				credentials: "include",
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.error || `Delete failed (${res.status})`)
			}
		},
		onSuccess: async () => {
			onFieldChange(KEY_FILE, null)
			await refreshSettings()
		},
	})

	const onPick = () => fileInputRef.current?.click()
	const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
		const chosen = e.target.files?.[0]
		if (chosen) uploadMutation.mutate(chosen)
		e.target.value = ""
	}

	const ModePill = ({
		value,
		icon,
		title,
		subtitle,
	}: {
		value: Mode
		icon: React.ReactNode
		title: string
		subtitle: string
	}) => {
		const active = mode === value
		return (
			<button
				type="button"
				onClick={() => onFieldChange(KEY_MODE, value)}
				className="rounded-xl border p-3 text-left transition-colors"
				style={{
					borderColor: active ? "var(--color-primary)" : "var(--color-border)",
					background: active
						? "color-mix(in oklab, var(--color-primary) 8%, transparent)"
						: "var(--color-surface)",
				}}
			>
				<div className="flex items-center gap-2">
					<span
						className="size-7 rounded-lg flex items-center justify-center"
						style={{
							background: active
								? "var(--color-primary)"
								: "var(--color-surface-alt)",
							color: active ? "white" : "var(--color-muted-foreground)",
						}}
					>
						{icon}
					</span>
					<p className="text-sm font-semibold">{title}</p>
				</div>
				<p
					className="text-xs mt-1.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{subtitle}
				</p>
			</button>
		)
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<Paperclip
						className="size-4"
						style={{ color: "var(--color-primary)" }}
					/>
					<CardTitle className="text-base">Company Profile Attachment</CardTitle>
					{mode !== "disabled" && (
						<Badge tone="info" className="ml-1">
							{mode === "url" ? "URL link" : "File attachment"}
						</Badge>
					)}
				</div>
				<p
					className="text-xs mt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Attach a company profile to the first outreach email — either a public
					URL injected into the body, or a PDF/DOCX attached to the message.
				</p>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<ModePill
						value="disabled"
						icon={<XCircle className="size-3.5" />}
						title="Disabled"
						subtitle="No profile attached. Email is sent as-is."
					/>
					<ModePill
						value="url"
						icon={<LinkIcon className="size-3.5" />}
						title="URL"
						subtitle="Inject a styled link to your hosted profile."
					/>
					<ModePill
						value="file"
						icon={<Paperclip className="size-3.5" />}
						title="File"
						subtitle="Attach PDF/DOCX directly to the email."
					/>
				</div>

				{mode === "url" && (
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Company Profile URL</Label>
						<p
							className="text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Publicly accessible URL. Will be rendered as a styled call-to-action
							above the email footer.
						</p>
						<Input
							type="url"
							placeholder="https://your-domain.com/company-profile.pdf"
							value={url}
							onChange={(e) => onFieldChange(KEY_URL, e.target.value)}
						/>
					</div>
				)}

				{mode === "file" && (
					<div className="space-y-3">
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPT}
							className="hidden"
							onChange={onFileChosen}
						/>

						{file ? (
							<div
								className="flex items-center gap-3 rounded-xl border p-3"
								style={{
									borderColor: "var(--color-border)",
									background: "var(--color-surface-alt)",
								}}
							>
								<MimeIcon mime={file.mime} />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold truncate">
										{file.fileName}
									</p>
									<p
										className="text-xs"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										{formatBytes(file.size)} ·{" "}
										{new Date(file.uploadedAt).toLocaleString()}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={onPick}
									disabled={uploadMutation.isPending}
									leadingIcon={
										uploadMutation.isPending ? (
											<Loader2 className="size-3.5 animate-spin" />
										) : (
											<Upload className="size-3.5" />
										)
									}
								>
									Replace
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => clearMutation.mutate()}
									disabled={clearMutation.isPending}
									leadingIcon={
										clearMutation.isPending ? (
											<Loader2 className="size-3.5 animate-spin" />
										) : (
											<Trash2 className="size-3.5" />
										)
									}
								>
									Remove
								</Button>
							</div>
						) : (
							<button
								type="button"
								onClick={onPick}
								disabled={uploadMutation.isPending}
								className="w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors"
								style={{
									borderColor: "var(--color-border)",
									background: "var(--color-surface)",
								}}
							>
								<div className="flex flex-col items-center gap-2">
									{uploadMutation.isPending ? (
										<Loader2 className="size-5 animate-spin" />
									) : (
										<Upload
											className="size-5"
											style={{ color: "var(--color-muted-foreground)" }}
										/>
									)}
									<p className="text-sm font-semibold">
										{uploadMutation.isPending
											? "Uploading…"
											: "Upload company profile"}
									</p>
									<p
										className="text-xs"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										PDF, DOCX or DOC — up to {formatBytes(MAX_BYTES)}
									</p>
								</div>
							</button>
						)}

						{uploadError && (
							<div
								className="rounded-lg border p-3 text-sm"
								style={{
									borderColor: "var(--color-danger)",
									color: "var(--color-danger)",
									background:
										"color-mix(in oklab, var(--color-danger) 8%, transparent)",
								}}
							>
								{uploadError}
							</div>
						)}
						{clearMutation.isError && (
							<div
								className="rounded-lg border p-3 text-sm"
								style={{
									borderColor: "var(--color-danger)",
									color: "var(--color-danger)",
									background:
										"color-mix(in oklab, var(--color-danger) 8%, transparent)",
								}}
							>
								{clearMutation.error instanceof Error
									? clearMutation.error.message
									: "Failed to remove file."}
							</div>
						)}
					</div>
				)}

				<p
					className="text-xs"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Only the <strong>first</strong> email in the sequence carries the
					profile. Follow-up emails stay lightweight.
				</p>
			</CardContent>
		</Card>
	)
}
