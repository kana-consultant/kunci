/**
 * Port for binary asset storage (uploaded files: company-profile PDFs, etc.).
 * Implementations live under infrastructure/storage/.
 *
 * Keys are opaque to callers — the adapter chooses the on-disk layout / object
 * key. Callers persist the returned key in app_settings or other metadata
 * stores to retrieve the bytes later.
 */
export interface FileStorage {
	put(input: {
		key: string
		bytes: Buffer
		mime: string
	}): Promise<void>

	get(key: string): Promise<{ bytes: Buffer; mime: string }>

	/** No-op if the key does not exist. */
	delete(key: string): Promise<void>
}
