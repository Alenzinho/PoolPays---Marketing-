import { supabase, ensureAuth } from './supabase';
import { Task, TaskStatus } from '../types';

// Helper to map DB result to App Task Type
const mapDbToTask = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    code: dbTask.code || '',
    title: dbTask.title,
    owner: dbTask.owner,
    status: dbTask.status as TaskStatus,
    category: dbTask.category || 'General',
    week: dbTask.week || 'Semana 1',
    deadline: dbTask.deadline ? new Date(dbTask.deadline) : null,
    demandType: dbTask.demand_type as any || 'GENERIC',
    
    // Map Relations
    subtasks: dbTask.subtasks ? dbTask.subtasks.map((s: any) => s.description) : [],
    briefing: dbTask.briefings && dbTask.briefings.length > 0 ? {
      idea: dbTask.briefings[0].idea,
      format: dbTask.briefings[0].format,
      copy: dbTask.briefings[0].copy,
      duration: dbTask.briefings[0].duration,
      soundtrack: dbTask.briefings[0].soundtrack,
      reference: dbTask.briefings[0].reference,
      psdLink: dbTask.briefings[0].psd_link,
      size: dbTask.briefings[0].size,
      fileLink: dbTask.briefings[0].file_link,
    } : {},
    attachments: dbTask.attachments ? dbTask.attachments.map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      size: a.size,
      content: a.content
    })) : []
  };
};

export const TaskService = {
  
  async getAllTasks(): Promise<Task[]> {
    await ensureAuth();
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (id, description, order_index),
        briefings (idea, format, copy, duration, soundtrack, reference, psd_link, size, file_link),
        attachments (id, name, type, size, content)
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(mapDbToTask);
  },

  async createTask(task: Task): Promise<Task> {
    const user = await ensureAuth();
    if (!user) throw new Error("User not authenticated");

    // 1. Insert Task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        id: task.id.length < 10 ? undefined : task.id, // Let DB generate UUID if it's a short mock ID
        user_id: user.id,
        code: task.code,
        title: task.title,
        status: task.status,
        owner: task.owner,
        category: task.category,
        demand_type: task.demandType,
        deadline: task.deadline ? task.deadline.toISOString() : null,
        week: task.week
      })
      .select()
      .single();

    if (taskError) throw taskError;
    const taskId = taskData.id;

    // 2. Insert Subtasks
    if (task.subtasks.length > 0) {
      const subtasksPayload = task.subtasks.map((desc, idx) => ({
        task_id: taskId,
        description: desc,
        order_index: idx
      }));
      await supabase.from('subtasks').insert(subtasksPayload);
    }

    // 3. Insert Briefing
    if (task.briefing && Object.keys(task.briefing).length > 0) {
      await supabase.from('briefings').insert({
        task_id: taskId,
        idea: task.briefing.idea,
        format: task.briefing.format,
        copy: task.briefing.copy,
        duration: task.briefing.duration,
        soundtrack: task.briefing.soundtrack,
        reference: task.briefing.reference,
        psd_link: task.briefing.psdLink,
        size: task.briefing.size,
        file_link: task.briefing.fileLink
      });
    }

    // 4. Insert Attachments
    if (task.attachments && task.attachments.length > 0) {
      const attPayload = task.attachments.map(att => ({
        task_id: taskId,
        name: att.name,
        type: att.type,
        size: att.size,
        content: att.content // Storing Base64 in DB text column (Not recommended for prod, but matches request)
      }));
      await supabase.from('attachments').insert(attPayload);
    }

    // Return mapped task (or fetch fresh)
    return this.getTaskById(taskId) as Promise<Task>;
  },

  async updateTask(task: Task): Promise<void> {
    const user = await ensureAuth();
    
    // 1. Update Main Task
    await supabase
      .from('tasks')
      .update({
        code: task.code,
        title: task.title,
        status: task.status,
        owner: task.owner,
        category: task.category,
        demand_type: task.demandType,
        deadline: task.deadline ? task.deadline.toISOString() : null,
        week: task.week,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    // 2. Sync Subtasks (Delete All + Re-insert strategy for simplicity)
    await supabase.from('subtasks').delete().eq('task_id', task.id);
    if (task.subtasks.length > 0) {
       const subtasksPayload = task.subtasks.map((desc, idx) => ({
        task_id: task.id,
        description: desc,
        order_index: idx
      }));
      await supabase.from('subtasks').insert(subtasksPayload);
    }

    // 3. Sync Briefing (Update or Insert)
    // Check if exists
    const { data: existingBriefing } = await supabase.from('briefings').select('id').eq('task_id', task.id).single();
    
    const briefingPayload = {
        idea: task.briefing.idea,
        format: task.briefing.format,
        copy: task.briefing.copy,
        duration: task.briefing.duration,
        soundtrack: task.briefing.soundtrack,
        reference: task.briefing.reference,
        psd_link: task.briefing.psdLink,
        size: task.briefing.size,
        file_link: task.briefing.fileLink
    };

    if (existingBriefing) {
        await supabase.from('briefings').update(briefingPayload).eq('task_id', task.id);
    } else if (Object.keys(task.briefing).length > 0) {
        await supabase.from('briefings').insert({ task_id: task.id, ...briefingPayload });
    }
    
    // 4. Sync Attachments (Complex in full system, simpler here: only add new ones logic usually required)
    // For now, we assume attachments are handled separately or immutable in update for MVP
  },

  async deleteTask(id: string): Promise<void> {
    // Cascade delete will handle related tables
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async getTaskById(id: string): Promise<Task | null> {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (id, description, order_index),
        briefings (idea, format, copy, duration, soundtrack, reference, psd_link, size, file_link),
        attachments (id, name, type, size, content)
      `)
      .eq('id', id)
      .single();
      
    return data ? mapDbToTask(data) : null;
  },

  subscribeToTasks(callback: (tasks: Task[]) => void) {
    // Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          // On any change, just re-fetch all (simplest strategy for consistency)
          this.getAllTasks().then(callback);
        }
      )
      .subscribe();

    return channel;
  }
};