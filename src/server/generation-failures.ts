import { AppError } from "./errors";
export type TransferStage =
  | "provider_status"
  | "download"
  | "validate"
  | "optimize"
  | "upload"
  | "verify_delivery"
  | "persist_asset";
export function generationFailure(error: unknown, stage: TransferStage) {
  const nativeCode =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const http =
    typeof error === "object" && error && "http_code" in error
      ? Number(error.http_code)
      : 0;
  const timeout =
    (error instanceof Error && /timeout|abort/i.test(error.name)) ||
    /TIMEOUT|TIMEDOUT/.test(nativeCode);
  const code =
    error instanceof AppError
      ? error.code
      : timeout
        ? "TIMEOUT"
        : http
          ? `HTTP_${http}`
          : /^(ECONNRESET|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|MODEL_SIZE|HTTP_\d{3})$/.test(
                nativeCode,
              )
            ? nativeCode
            : "UNAVAILABLE";
  const status = Number(/^HTTP_(\d{3})$/.exec(code)?.[1] || http);
  const retryable =
    ![
      "TRANSFER_HOST",
      "NOT_CONFIGURED",
      "INVALID_MODEL",
      "OUTPUT_FORMAT",
      "MODEL_SIZE",
      "STORAGE_CONFIGURATION",
      "STORAGE_AUTH",
      "STORAGE_QUOTA",
      "STORAGE_SIZE_LIMIT",
    ].includes(code) &&
    !(status >= 400 && status < 500 && status !== 408 && status !== 429);
  const label = {
    provider_status: "Checking the generated model",
    download: "Downloading the generated model",
    validate: "Checking the model format",
    optimize: "Preparing the model for storage",
    upload: "Storing the model",
    verify_delivery: "Verifying stored model delivery",
    persist_asset: "Adding the model to your library",
  }[stage];
  return {
    code,
    retryable,
    message:
      code === "STORAGE_SIZE_LIMIT"
        ? "The generated model is too large for this storage account even after texture optimisation. Contact the workspace administrator to finish delivery; generating another copy is not needed."
        : ["STORAGE_AUTH", "STORAGE_QUOTA", "STORAGE_CONFIGURATION"].includes(
              code,
            )
          ? "Model storage settings need attention. Your generation has completed; delivery can resume after the administrator corrects storage. Do not generate another copy."
          : retryable
            ? `${label} was interrupted. Delivery will retry; no new generation will be submitted.`
            : `${label} needs attention. Your generated model has been retained; contact the workspace administrator before trying again.`,
  };
}
