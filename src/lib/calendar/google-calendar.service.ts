import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarConnection } from "@/types";

// ==============================================
// Google Calendar Service
// ==============================================

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state,
    prompt: "consent",
  });
}

export async function handleOAuthCallback(code: string, userId: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) return false;

    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list({ maxResults: 1 });
    const primaryCalendarId = calendarList.items?.[0]?.id || "primary";

    const admin = createAdminClient();

    // Upsert connection
    const { error } = await admin
      .from("calendar_connections")
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
        calendar_id: primaryCalendarId,
        is_active: true,
      }, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to save calendar connection:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return false;
  }
}

async function getAuthenticatedClient(userId: string) {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!connection) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: new Date(connection.token_expires_at).getTime(),
  });

  // Refresh if expired
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (credentials.access_token !== connection.access_token) {
    await admin
      .from("calendar_connections")
      .update({
        access_token: credentials.access_token,
        token_expires_at: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString(),
      })
      .eq("id", connection.id);
  }

  return { oauth2Client, connection };
}

export async function createCalendarEvent(
  userId: string,
  appointmentId: string,
  summary: string,
  description: string,
  startTime: string,
  endTime: string
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return null;

    const calendar = google.calendar({ version: "v3", auth: auth.oauth2Client });
    const { data: event } = await calendar.events.insert({
      calendarId: auth.connection.calendar_id || "primary",
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime, timeZone: process.env.CLINIC_TIMEZONE || "America/New_York" },
        end: { dateTime: endTime, timeZone: process.env.CLINIC_TIMEZONE || "America/New_York" },
      },
    });

    // Store calendar event
    const admin = createAdminClient();
    await admin.from("calendar_events").insert({
      appointment_id: appointmentId,
      connection_id: auth.connection.id,
      google_event_id: event.id,
      action: "CREATE",
      sync_status: "SYNCED",
    });

    return event.id || null;
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  summary: string,
  description: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return false;

    const calendar = google.calendar({ version: "v3", auth: auth.oauth2Client });
    await calendar.events.update({
      calendarId: auth.connection.calendar_id || "primary",
      eventId: googleEventId,
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime, timeZone: process.env.CLINIC_TIMEZONE || "America/New_York" },
        end: { dateTime: endTime, timeZone: process.env.CLINIC_TIMEZONE || "America/New_York" },
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    return false;
  }
}

export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string
): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return false;

    const calendar = google.calendar({ version: "v3", auth: auth.oauth2Client });
    await calendar.events.delete({
      calendarId: auth.connection.calendar_id || "primary",
      eventId: googleEventId,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    return false;
  }
}

export async function disconnectCalendar(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("calendar_connections")
    .update({ is_active: false })
    .eq("user_id", userId);

  return !error;
}
