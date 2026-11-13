import { afterEach, describe, it, expect, vi } from "vitest";
import { siteUrl, indexableSite, pageMetadata, jsonLd } from "../src/lib/seo";
afterEach(() => vi.unstubAllEnvs());
describe("SEO configuration and privacy", () => {
  it("uses a single canonical origin without query strings or credential leakage", () => {
    vi.stubEnv("SITE_URL", "https://buildo.example/path?tracking=1");
    expect(siteUrl().toString()).toBe("https://buildo.example/");
    const m = pageMetadata({ title: "Explore", path: "/explore" });
    expect(m.alternates?.canonical).toBe("https://buildo.example/explore");
    expect(m.robots).toEqual({ index: true, follow: true });
  });
  it("keeps local and HTTP environments out of indexing", () => {
    for (const url of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://localhost:3000",
      "http://buildo.example",
    ]) {
      vi.stubEnv("SITE_URL", url);
      expect(indexableSite()).toBe(false);
      expect(pageMetadata({ title: "Home", path: "/" }).robots).toEqual({
        index: false,
        follow: false,
      });
    }
  });
  it("supports explicit noindex on an otherwise public production site", () => {
    vi.stubEnv("SITE_URL", "https://buildo.example");
    expect(
      pageMetadata({
        title: "Unavailable",
        path: "/designs/missing",
        noindex: true,
      }).robots,
    ).toEqual({ index: false, follow: false });
  });
  it("rejects credential-bearing and non-HTTP canonical origins", () => {
    for (const url of [
      "https://user:secret@buildo.example",
      "file:///tmp/site",
    ]) {
      vi.stubEnv("SITE_URL", url);
      expect(() => siteUrl()).toThrow();
    }
  });
  it("escapes script delimiters in structured data", () => {
    const value = { name: "</script><script>alert(1)</script>" };
    const serialized = jsonLd(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
