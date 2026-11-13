import { it, expect } from "vitest";
import { body, readBounded, origin } from "../src/server/http";
import { publicAddress } from "../src/server/storage";
it("rejects cross-origin domain writes and permits same-origin requests", () => {
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  expect(() =>
    origin(
      new Request("http://localhost:3000", {
        method: "POST",
        headers: { Origin: "https://other.example" },
      }),
    ),
  ).toThrow();
  expect(() =>
    origin(
      new Request("http://localhost:3000", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
      }),
    ),
  ).not.toThrow();
});
it("bounds a streamed request without trusting Content-Length", async () => {
  await expect(
    readBounded(
      new Request("http://localhost", { method: "POST", body: "123456789" }),
      4,
    ),
  ).rejects.toMatchObject({ code: "TOO_LARGE" });
  await expect(
    body(new Request("http://localhost", { method: "POST", body: "not json" })),
  ).rejects.toMatchObject({ code: "JSON" });
});
it("rejects loopback, metadata, private, CGNAT and IPv6 transfer destinations", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.0.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    expect(publicAddress(ip)).toBe(false);
  expect(publicAddress("8.8.8.8")).toBe(true);
});
