import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

export const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
  return new ConvexHttpClient(url);
};

export const fetchQuery = async <T>(query: any, args: any = {}): Promise<T> => {
  const client = getConvexClient();
  try {
      const { getToken } = await auth();
      const token = await getToken({ template: "convex" });

      if (token) {
        client.setAuth(token);
      }
  } catch (error) {
      // If auth fails (e.g. during build or outside request context), we might still want to fetch public data?
      // But for user data, it will fail.
      // We'll log and proceed without auth (query will likely fail if protected).
      console.warn("Failed to get auth token for server fetch:", error);
  }

  return client.query(query, args);
};
