import { readFile } from "node:fs/promises";
import type { APIRoute } from "astro";
import { getRawAssetRoutePaths } from "../../../core/content-loader";
import type { RawAssetRouteProps } from "../../../core/types";

export const prerender = true;

export function getStaticPaths() {
  return getRawAssetRoutePaths();
}

export const GET: APIRoute<RawAssetRouteProps> = async ({ props }) => {
  const body = await readFile(props.absolutePath);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": props.contentType,
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

