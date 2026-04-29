import { describe, expect, it } from "vitest"
import {
	AppError,
	badRequest,
	conflict,
	internalError,
	notFound,
	unauthorized,
} from "../../api/src/application/shared/errors"

describe("api-e2e", () => {
	it("creates typed AppError instances from helpers", () => {
		expect(unauthorized("Auth required")).toBeInstanceOf(AppError)
		expect(badRequest("Invalid payload").code).toBe("BAD_REQUEST")
		expect(conflict("Already exists").code).toBe("CONFLICT")
		expect(notFound("Missing resource").code).toBe("NOT_FOUND")
		expect(internalError("Unexpected error").code).toBe("INTERNAL_ERROR")
	})

	it("preserves code and message for AppError", () => {
		const error = new AppError("FORBIDDEN", "Not allowed")
		expect(error.name).toBe("AppError")
		expect(error.code).toBe("FORBIDDEN")
		expect(error.message).toBe("Not allowed")
	})
})
