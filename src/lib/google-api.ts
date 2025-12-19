import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function getGoogleAuth() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.provider_token) {
    throw new Error('No Google session found');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: session.provider_token });
  return auth;
}

/**
 * Formats a date string for Google Tasks/Calendar to avoid timezone shifts.
 * Google Tasks only cares about the date part, but requires a full ISO string.
 * Setting it to noon UTC ensures it stays on the same day in most timezones.
 */
function formatGoogleDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
}

export async function syncTaskToGoogle(task: any, project?: any) {
  const auth = await getGoogleAuth();
  const tasks = google.tasks({ version: 'v1', auth });
  const calendar = google.calendar({ version: 'v3', auth });

  const taskListId = project?.googleTaskListId || '@default';

  // Sync to Google Tasks
  if (task.googleTaskId) {
    await tasks.tasks.update({
      tasklist: taskListId,
      task: task.googleTaskId,
      requestBody: {
        id: task.googleTaskId,
        title: task.title,
        status: task.isCompleted ? 'completed' : 'needsAction',
        due: task.dueDate ? formatGoogleDate(task.dueDate) : undefined,
      },
    });
  } else {
    const res = await tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title: task.title,
        status: task.isCompleted ? 'completed' : 'needsAction',
        due: task.dueDate ? formatGoogleDate(task.dueDate) : undefined,
      },
    });
    task.googleTaskId = res.data.id;
  }

  // Sync to Google Calendar if it has a due date
  if (task.dueDate) {
    const googleDate = formatGoogleDate(task.dueDate);
    const endDate = new Date(new Date(googleDate).getTime() + 3600000).toISOString();

    if (task.googleEventId) {
      await calendar.events.update({
        calendarId: 'primary',
        eventId: task.googleEventId,
        requestBody: {
          summary: task.title,
          start: { dateTime: googleDate },
          end: { dateTime: endDate },
        },
      });
    } else {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: task.title,
          start: { dateTime: googleDate },
          end: { dateTime: endDate },
        },
      });
      task.googleEventId = res.data.id;
    }
  } else if (task.googleEventId) {
    // Due date removed, delete the event
    try {
      await calendar.events.delete({ calendarId: 'primary', eventId: task.googleEventId });
      task.googleEventId = null;
    } catch (e) {
      console.error('Failed to delete Google Event', e);
    }
  }

  return task;
}

export async function syncProjectToGoogle(project: any) {
  const auth = await getGoogleAuth();
  const tasks = google.tasks({ version: 'v1', auth });

  if (project.googleTaskListId) {
    await tasks.tasklists.update({
      tasklist: project.googleTaskListId,
      requestBody: {
        title: project.name,
      },
    });
  } else {
    const res = await tasks.tasklists.insert({
      requestBody: {
        title: project.name,
      },
    });
    project.googleTaskListId = res.data.id;
  }

  return project;
}

export async function deleteGoogleTaskList(googleTaskListId: string) {
  const auth = await getGoogleAuth();
  const tasks = google.tasks({ version: 'v1', auth });
  try {
    await tasks.tasklists.delete({ tasklist: googleTaskListId });
  } catch (e) {
    console.error('Failed to delete Google Task List', e);
  }
}

export async function deleteGoogleTask(googleTaskId: string, taskListId: string = '@default') {
  const auth = await getGoogleAuth();
  const tasks = google.tasks({ version: 'v1', auth });
  try {
    await tasks.tasks.delete({ tasklist: taskListId, task: googleTaskId });
  } catch (e) {
    console.error('Failed to delete Google Task', e);
  }
}

export async function deleteGoogleEvent(googleEventId: string) {
  const auth = await getGoogleAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
  } catch (e) {
    console.error('Failed to delete Google Event', e);
  }
}
