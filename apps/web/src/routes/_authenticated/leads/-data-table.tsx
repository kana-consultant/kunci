import {
	DataTablePagination,
	DataTableToolbar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@kana-consultant/ui-kit"
import { useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { stageLabels, statusLabels, type Lead } from "./-columns"

interface DataTableProps {
	columns: ColumnDef<Lead>[]
	data: Lead[]
}

const statusFilterOptions = Object.keys(statusLabels)

export function DataTable({ columns, data }: DataTableProps) {
	const navigate = useNavigate()
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	return (
		<div className="flex flex-col gap-4 p-5">
			<div>
				<DataTableToolbar
					table={table}
					searchColumn="fullName"
					searchPlaceholder="Search leads..."
					filters={
						<div className="flex flex-wrap items-center gap-2">
							<Select
								value={
									(table
										.getColumn("replyStatus")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("replyStatus")
										?.setFilterValue(value === "all" ? undefined : value)
								}
							>
								<SelectTrigger className="h-8 w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									{statusFilterOptions.map((status) => (
										<SelectItem key={status} value={status}>
											{statusLabels[status] ?? status.replaceAll("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={
									table.getColumn("stage")?.getFilterValue() === undefined
										? "all"
										: String(table.getColumn("stage")?.getFilterValue())
								}
								onValueChange={(value) =>
									table
										.getColumn("stage")
										?.setFilterValue(
											value === "all" ? undefined : Number(value),
										)
								}
							>
								<SelectTrigger className="h-8 w-[150px]">
									<SelectValue placeholder="Stage" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All stages</SelectItem>
									{Object.entries(stageLabels).map(([stage, value]) => (
										<SelectItem key={stage} value={stage}>
											{value.text}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					}
				/>
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								)
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() ? "selected" : undefined}
								className="cursor-pointer"
								onClick={() => {
									navigate({
										to: "/leads/$leadId",
										params: { leadId: row.original.id },
									})
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<div className="border-t border-border pt-2">
				<DataTablePagination table={table} />
			</div>
		</div>
	)
}
