import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface CalendarEventParams {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails?: string[];
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: calendar_v3.Calendar | null = null;
  private readonly calendarId: string;

  constructor() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      const auth = new OAuth2Client(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
      this.calendar = google.calendar({ version: 'v3', auth });
      this.logger.log('Google Calendar API initialized');
    } else {
      this.logger.warn(
        'Google Calendar credentials not configured — calendar sync disabled',
      );
    }
  }

  isEnabled(): boolean {
    return this.calendar !== null;
  }

  async createEvent(params: CalendarEventParams): Promise<string | null> {
    if (!this.calendar) return null;

    try {
      const event: calendar_v3.Schema$Event = {
        summary: params.summary,
        description: params.description || 'Spanish language lesson',
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: params.endTime.toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      if (params.attendeeEmails?.length) {
        event.attendees = params.attendeeEmails.map((email) => ({ email }));
      }

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
      });

      this.logger.log(`Created calendar event: ${response.data.id}`);
      return response.data.id || null;
    } catch (error) {
      this.logger.error('Failed to create Google Calendar event', error.stack);
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    params: CalendarEventParams,
  ): Promise<boolean> {
    if (!this.calendar) return false;

    try {
      const event: calendar_v3.Schema$Event = {
        summary: params.summary,
        description: params.description || 'Spanish language lesson',
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: params.endTime.toISOString(),
          timeZone: 'UTC',
        },
      };

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId,
        requestBody: event,
      });

      this.logger.log(`Updated calendar event: ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to update Google Calendar event', error.stack);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.calendar) return false;

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId,
      });

      this.logger.log(`Deleted calendar event: ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete Google Calendar event', error.stack);
      return false;
    }
  }
}
