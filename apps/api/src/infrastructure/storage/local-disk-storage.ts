import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, normalize, resolve, sep } from "node:path"
import type { FileStorage } from "#/domain/ports/file-storage.ts"

interface LocalDiskConfig {
	/** Absolute or cwd-relative root dir. Created on first write. */
	root: string
}

/**
 * Filesystem-backed FileStorage. One file per key, mime sidecar stored as
 * `<key>.mime`. Adapter is intentionally simple — replace with S3/R2 when
 * scale demands it.
 */
export function createLocalDiskStorage(config: LocalDiskConfig): FileStorage {
	const root = resolve(process.cwd(), config.root)

	function resolvePath(key: string): string {
		const normalized = normalize(key).replace(/^([./\\]+)/, "")
		if (!normalized || normalized.includes("..") || isAbsolute(normalized)) {
			throw new Error(`Invalid storage key: ${key}`)
		}
		const full = resolve(root, normalized)
		if (full !== root && !full.startsWith(root + sep)) {
			throw new Error(`Storage key escapes root: ${key}`)
		}
		return full
	}

	return {
		async put({ key, bytes, mime }) {
			const path = resolvePath(key)
			await mkdir(dirname(path), { recursive: true })
			await writeFile(path, bytes)
			await writeFile(`${path}.mime`, mime, "utf-8")
		},

		async get(key) {
			const path = resolvePath(key)
			const [bytes, mime] = await Promise.all([
				readFile(path),
				readFile(`${path}.mime`, "utf-8").catch(
					() => "application/octet-stream",
				),
			])
			return { bytes, mime: mime.trim() }
		},

		async delete(key) {
			const path = resolvePath(key)
			await rm(path, { force: true })
			await rm(`${path}.mime`, { force: true })
		},
	}
}
