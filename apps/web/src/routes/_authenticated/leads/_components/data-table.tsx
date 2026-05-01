import {
	DataTablePagination,
	DataTableToolbar,
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

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
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
		<div className="flex flex-col gap-3">
			<DataTableToolbar
				table={table}
				searchColumn="fullName"
				searchPlaceholder="Search by name..."
			/>
			<div
				className="overflow-x-auto rounded-md border"
				style={{ borderColor: "var(--color-border)" }}
			>
				<Table>
					<TableHeader style={{ background: "var(--color-surface-alt)" }}>
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
									data-state={row.getIsSelected() && "selected"}
									className="cursor-pointer"
									onClick={() => {
										const leadId = (row.original as { id: string }).id
										if (leadId) {
											navigate({
												to: "/leads/$leadId",
												params: { leadId },
											})
										}
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	)
}
