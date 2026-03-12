import { create } from 'zustand';

interface GenerationTask {
  id: string;
  taskType: 'text_to_image' | 'image_edit' | 'image_fusion';
  prompt: string;
  negativePrompt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputImages?: string[];
  errorMessage?: string;
  costCredits: number;
  createdAt: string;
}

interface GenerationState {
  tasks: GenerationTask[];
  currentTask: GenerationTask | null;
  isLoading: boolean;
  
  // Actions
  createTask: (taskData: Partial<GenerationTask>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<GenerationTask>) => void;
  setCurrentTask: (task: GenerationTask | null) => void;
  fetchTaskStatus: (taskId: string) => Promise<void>;
  clearTasks: () => void;
  addTask: (task: GenerationTask) => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,

  createTask: async (taskData) => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      const newTask: GenerationTask = {
        id: result.taskId,
        taskType: taskData.taskType!,
        prompt: taskData.prompt!,
        negativePrompt: taskData.negativePrompt,
        status: 'processing',
        costCredits: result.requiredCredits,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        tasks: [newTask, ...state.tasks],
        currentTask: newTask,
        isLoading: false
      }));

      return result.taskId;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
      currentTask: state.currentTask?.id === taskId
        ? { ...state.currentTask, ...updates }
        : state.currentTask
    }));
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
  },

  fetchTaskStatus: async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      const task = await response.json();
      
      if (response.ok) {
        get().updateTask(taskId, task);
      }
    } catch (error) {
      console.error('Failed to fetch task status:', error);
    }
  },

  clearTasks: () => {
    set({ tasks: [], currentTask: null });
  },

  addTask: (task) => {
    set(state => ({
      tasks: [task, ...state.tasks]
    }));
  }
}));

async function getAuthToken(): Promise<string> {
  // from Supabase The client obtains the current session token
  const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());
  return session?.access_token || '';
}
