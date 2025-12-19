'use server';

import { syncTaskToGoogle, deleteGoogleTask, deleteGoogleEvent, syncProjectToGoogle, deleteGoogleTaskList } from '@/lib/google-api';
import { createClient } from '@/lib/supabase/server';

export async function syncProjectAction(project: any) {
  try {
    const supabase = await createClient();
    const updatedProject = await syncProjectToGoogle(project);
    
    await supabase.from('projects').update({
      google_task_list_id: updatedProject.googleTaskListId
    }).eq('id', project.id);

    return { success: true, project: updatedProject };
  } catch (error: any) {
    console.error('Google Project Sync Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAction(googleTaskListId: string) {
  try {
    await deleteGoogleTaskList(googleTaskListId);
    return { success: true };
  } catch (error: any) {
    console.error('Google Project Delete Error:', error);
    return { success: false, error: error.message };
  }
}

export async function syncTaskAction(task: any, projectId?: string) {
  try {
    const supabase = await createClient();
    
    // Fetch current task from DB to get existing Google IDs if client state is missing them
    const { data: dbTask } = await supabase
      .from('tasks')
      .select('google_task_id, google_event_id')
      .eq('id', task.id)
      .single();

    if (dbTask) {
      if (!task.googleTaskId && dbTask.google_task_id) {
        task.googleTaskId = dbTask.google_task_id;
      }
      if (!task.googleEventId && dbTask.google_event_id) {
        task.googleEventId = dbTask.google_event_id;
      }
    }

    let project = null;
    if (projectId) {
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
      project = data;
    }

    const updatedTask = await syncTaskToGoogle(task, project);
    
    // Update the task in Supabase with the new Google IDs
    // We use a direct update and check the result
    const { data: updateData, error: updateError } = await supabase
      .from('tasks')
      .update({
        google_task_id: updatedTask.googleTaskId || null,
        google_event_id: updatedTask.googleEventId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select();

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
    } else {
      console.log('Supabase Update Success:', updateData);
    }

    return { 
      success: true, 
      task: updatedTask,
      googleTaskId: updatedTask.googleTaskId,
      googleEventId: updatedTask.googleEventId
    };
  } catch (error: any) {
    console.error('Google Sync Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTaskAction(googleTaskId?: string, googleEventId?: string, projectId?: string) {
  try {
    const supabase = await createClient();
    let project = null;
    if (projectId) {
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
      project = data;
    }

    if (googleTaskId) {
      await deleteGoogleTask(googleTaskId, project?.google_task_list_id || '@default');
    }
    if (googleEventId) {
      await deleteGoogleEvent(googleEventId);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Google Delete Error:', error);
    return { success: false, error: error.message };
  }
}
