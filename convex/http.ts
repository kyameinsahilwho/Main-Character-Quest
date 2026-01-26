import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook endpoint to handle user events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const payload = await request.text();

    const wh = new Webhook(webhookSecret);
    let evt: any;

    // Verify the webhook
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid webhook signature", { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;
    const userData = evt.data;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = userData;
      
      // Get primary email
      const primaryEmail = email_addresses?.find(
        (email: any) => email.id === userData.primary_email_address_id
      )?.email_address;

      // Create the token identifier in the same format Clerk uses
      // Format: https://<issuer-domain>|<user-id>
      const issuerDomain = "https://literate-haddock-61.clerk.accounts.dev";
      const tokenIdentifier = `${issuerDomain}|${id}`;

      // Build user name
      const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;

      try {
        await ctx.runMutation(internal.users.upsertFromClerk, {
          tokenIdentifier,
          email: primaryEmail,
          name,
          image: image_url,
        });
        console.log(`User ${eventType}:`, id);
      } catch (error) {
        console.error("Error upserting user:", error);
        return new Response("Error processing webhook", { status: 500 });
      }
    }

    if (eventType === "user.deleted") {
      const { id } = userData;
      const issuerDomain = "https://literate-haddock-61.clerk.accounts.dev";
      const tokenIdentifier = `${issuerDomain}|${id}`;
      
      try {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          tokenIdentifier,
        });
        console.log("User deleted:", id);
      } catch (error) {
        console.error("Error deleting user:", error);
        return new Response("Error processing webhook", { status: 500 });
      }
    }

    return new Response("Webhook processed", { status: 200 });
  }),
});

export default http;
