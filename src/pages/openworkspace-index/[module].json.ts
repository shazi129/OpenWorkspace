import type { APIRoute } from "astro";
import { getContentIndexRoutePaths } from "../../core/content-loader";
import type { ContentIndexRouteProps } from "../../core/types";

export const prerender = true;

export function getStaticPaths() {
  return getContentIndexRoutePaths();
}

export const GET: APIRoute<ContentIndexRouteProps> = ({ props }) =>
  new Response(JSON.stringify(props.entries), {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
