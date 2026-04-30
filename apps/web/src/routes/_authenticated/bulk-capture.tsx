import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
} from "@kana-consultant/ui-kit"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Copy,
	Download,
	FileSpreadsheet,
	Loader2,
	Trash2,
	Upload,
	Users,
	XCircle,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { useBulkCaptureLogic } from "./_hooks/use-bulk-capture"

export const Route = createFileRoute("/_authenticated/bulk-capture")({
	component: BulkCapturePage,
})

const CSV_TEMPLATE = `fullName,email,companyName,companyWebsite,painPoints,linkedinUrl
John Doe,john@acme.com,Acme Corp,https://acme.com,Slow lead response times,https://linkedin.com/in/johndoe
Jane Smith,jane@globex.com,Globex Corp,https://globex.com,Poor email deliverability,`

function BulkCapturePage() {
	const {
		parsedRows,
		parseErrors,
		result,
		isPending,
		error,
		handleFileUpload,
		handleTextPaste,
		submitBulk,
		reset,
		navigateToLeads,
	} = useBulkCaptureLogic()

	const fileInputRef = useRef<HTMLInputElement>(null)
	const [csvText, setCsvText] = useState("")
	const [dragActive, setDragActive] = useState(false)

	const onFileDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragActive(false)
			const file = e.dataTransfer.files[0]
			if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
				handleFileUpload(file)
			}
		},
		[handleFileUpload],
	)

	const onFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFileUpload(file)
		},
		[handleFileUpload],
	)

	const downloadTemplate = useCallback(() => {
		const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = "leads_template.csv"
		a.click()
		URL.revokeObjectURL(url)
	}, [])

	const copyTemplate = useCallback(() => {
		navigator.clipboard.writeText(CSV_TEMPLATE)
	}, [])

	// Results view
	if (result) {
		return (
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Bulk Import Results</h1>
						<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
							Import completed — review the results below.
						</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline" onClick={reset}>
							Import More
						</Button>
						<Button onClick={navigateToLeads}>
							View All Leads
						</Button>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-6 flex items-center gap-4">
							<div className="p-3 rounded-xl bg-[var(--color-success-muted)]">
								<CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
							</div>
							<div>
								<p className="text-2xl font-bold">{result.created.length}</p>
								<p className="text-sm text-[var(--color-muted-foreground)]">
									Created Successfully
								</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 flex items-center gap-4">
							<div className="p-3 rounded-xl bg-[var(--color-warning-muted)]">
								<AlertCircle className="w-6 h-6 text-[var(--color-warning)]" />
							</div>
							<div>
								<p className="text-2xl font-bold">{result.duplicates.length}</p>
								<p className="text-sm text-[var(--color-muted-foreground)]">
									Duplicates Skipped
								</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 flex items-center gap-4">
							<div className="p-3 rounded-xl bg-[var(--color-danger-muted)]">
								<XCircle className="w-6 h-6 text-[var(--color-danger)]" />
							</div>
							<div>
								<p className="text-2xl font-bold">{result.invalid.length}</p>
								<p className="text-sm text-[var(--color-muted-foreground)]">
									Invalid Entries
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Duplicates Details */}
				{result.duplicates.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />
								Duplicates ({result.duplicates.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader className="bg-[var(--color-muted-subtle)]">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.duplicates.map((d, i) => (
										<TableRow key={i}>
											<TableCell>{d.fullName}</TableCell>
											<TableCell className="text-[var(--color-muted-foreground)]">
												{d.email}
											</TableCell>
											<TableCell>
												<Badge tone="warning">{d.reason}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				{/* Invalid Details */}
				{result.invalid.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<XCircle className="w-4 h-4 text-[var(--color-danger)]" />
								Invalid Entries ({result.invalid.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader className="bg-[var(--color-muted-subtle)]">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.invalid.map((inv, i) => (
										<TableRow key={i}>
											<TableCell>{inv.fullName}</TableCell>
											<TableCell className="text-[var(--color-muted-foreground)]">
												{inv.email}
											</TableCell>
											<TableCell>
												<Badge tone="danger">{inv.reason}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/leads">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="w-4 h-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold">Bulk Import Leads</h1>
						<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
							Upload a CSV file or paste CSV data to import multiple leads at
							once.
						</p>
					</div>
				</div>
			</div>

			{/* Template Download */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<FileSpreadsheet className="w-4 h-4" />
						CSV Template
					</CardTitle>
					<CardDescription>
						Download or copy the template to ensure your CSV has the correct
						format.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-[var(--color-muted-subtle)] p-4 rounded-lg overflow-x-auto">
						<pre className="text-xs font-mono whitespace-pre">
							{CSV_TEMPLATE}
						</pre>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={downloadTemplate}
							leadingIcon={<Download className="w-3.5 h-3.5" />}
						>
							Download Template
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={copyTemplate}
							leadingIcon={<Copy className="w-3.5 h-3.5" />}
						>
							Copy to Clipboard
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Upload Area */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Upload className="w-4 h-4" />
						Import Data
					</CardTitle>
					<CardDescription>
						Upload a CSV file or paste your data directly. Duplicates will be
						automatically detected and skipped.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Drop Zone */}
					<div
						className={`
							border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
							${dragActive ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]" : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-muted-subtle)]"}
						`}
						onDragOver={(e) => {
							e.preventDefault()
							setDragActive(true)
						}}
						onDragLeave={() => setDragActive(false)}
						onDrop={onFileDrop}
						onClick={() => fileInputRef.current?.click()}
					>
						<Upload className="w-8 h-8 mx-auto mb-3 text-[var(--color-muted-foreground)]" />
						<p className="font-medium">
							Drop your CSV file here or click to browse
						</p>
						<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
							Supports .csv files up to 100 leads
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={onFileSelect}
						/>
					</div>

					{/* Divider */}
					<div className="flex items-center gap-4">
						<div className="flex-1 border-t" />
						<span className="text-sm text-[var(--color-muted-foreground)]">
							or paste CSV data
						</span>
						<div className="flex-1 border-t" />
					</div>

					{/* Text Area */}
					<Textarea
						className="min-h-[160px] font-mono"
						placeholder="Paste your CSV data here...&#10;fullName,email,companyName,companyWebsite&#10;John Doe,john@acme.com,Acme Corp,https://acme.com"
						value={csvText}
						onChange={(e) => setCsvText(e.target.value)}
					/>
					{csvText.trim() && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								handleTextPaste(csvText)
							}}
						>
							Parse CSV Data
						</Button>
					)}

					{/* Parse Errors */}
					{parseErrors.length > 0 && (
						<div className="p-4 rounded-lg bg-[var(--color-danger-muted)] border border-[var(--color-danger)]">
							<p className="font-medium text-[var(--color-danger)] mb-2 flex items-center gap-2">
								<AlertCircle className="w-4 h-4" />
								CSV Parse Errors
							</p>
							<ul className="list-disc list-inside text-sm space-y-1">
								{parseErrors.map((err, i) => (
									<li key={i}>{err}</li>
								))}
							</ul>
						</div>
					)}

					{/* API Error */}
					{error && (
						<div className="p-3 text-sm bg-[var(--color-danger-muted)] text-[var(--color-danger)] rounded-lg border border-[var(--color-danger)]">
							{(error as any)?.message || "Failed to import leads"}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Preview Table */}
			{parsedRows.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base flex items-center gap-2">
									<Users className="w-4 h-4" />
									Preview ({parsedRows.length} leads)
								</CardTitle>
								<CardDescription>
									Review the parsed data before importing. Duplicates will be
									automatically skipped.
								</CardDescription>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={reset}
								leadingIcon={<Trash2 className="w-3.5 h-3.5" />}
							>
								Clear
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0 overflow-x-auto">
						<Table>
							<TableHeader className="bg-[var(--color-muted-subtle)]">
								<TableRow>
									<TableHead className="w-12">#</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Company</TableHead>
									<TableHead>Website</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{parsedRows.map((row, i) => (
									<TableRow key={i}>
										<TableCell className="text-[var(--color-muted-foreground)]">
											{i + 1}
										</TableCell>
										<TableCell className="font-medium">{row.fullName}</TableCell>
										<TableCell className="text-[var(--color-muted-foreground)]">
											{row.email}
										</TableCell>
										<TableCell>{row.companyName}</TableCell>
										<TableCell className="text-[var(--color-primary)]">
											{row.companyWebsite.replace(/^https?:\/\//, "")}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
					<CardFooter className="flex justify-end gap-3 border-t p-6 bg-[var(--color-muted-subtle)]">
						<Button variant="ghost" onClick={reset}>
							Cancel
						</Button>
						<Button
							onClick={submitBulk}
							disabled={isPending}
							leadingIcon={
								isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Upload className="w-4 h-4" />
								)
							}
						>
							{isPending
								? `Importing ${parsedRows.length} leads...`
								: `Import ${parsedRows.length} Leads`}
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	)
}
