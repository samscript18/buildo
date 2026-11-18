import { expect, it } from "vitest";
import { storageUploadError } from "../src/server/storage";
import { generationFailure } from "../src/server/generation-failures";
it("recognizes a Cloudinary account size rejection and gives a safe actionable code", () => {
  const error = storageUploadError({
    http_code: 400,
    message: "File size too large. Got 16403964. Maximum is 10485760.",
  });
  expect(error.code).toBe("STORAGE_SIZE_LIMIT");
  expect(generationFailure(error, "upload").retryable).toBe(false);
});
it("retries Cloudinary's 499 upload timeout rather than treating it as permanent", () => {
  const error = storageUploadError({
    http_code: 499,
    message: "Request Timeout",
  });
  expect(generationFailure(error, "upload")).toMatchObject({
    code: "STORAGE_TIMEOUT",
    retryable: true,
  });
});
it("redacts credentials and signature text from authentication failures", () => {
  const error = storageUploadError({
    http_code: 401,
    message: "Invalid Signature TEST-ONLY-sensitive-signature",
  });
  expect(error.message).not.toContain("TEST-ONLY-sensitive-signature");
  expect(generationFailure(error, "upload")).toMatchObject({
    code: "STORAGE_AUTH",
    retryable: false,
  });
});
it("keeps throttling and server errors recoverable", () => {
  for (const http_code of [429, 500, 503])
    expect(
      generationFailure(storageUploadError({ http_code }), "upload").retryable,
    ).toBe(true);
});
