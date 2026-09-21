/**
 * HabitFlow - Storage and State Management
 */

const STORAGE_KEYS = {
  HABITS: 'habitflow_habits_v1',
  LOGS: 'habitflow_logs_v1',
  SETTINGS: 'habitflow_settings_v1',
  INITIALIZED: 'habitflow_initialized_v1'
};

const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  soundEnabled: true,
  confettiEnabled: true,
  firstDayOfWeek: 1, // 0 = Sun, 1 = Mon
  currentView: 'today'
};

class StorageManager {
  static getHabits() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading habits from localStorage:', e);
      return [];
    }
  }

  static saveHabits(habits) {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits:', e);
    }
  }

  static getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading logs:', e);
      return {};
    }
  }

  static saveLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  }

  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  static initDefaultDataIfNeeded() {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      // Load starter habits and some realistic recent past logs for demonstration
      const initialHabits = [
        {
          id: 'h_water_' + Date.now(),
          name: 'Drink 2.5L Water',
          description: 'Stay refreshed & hydrated',
          category: 'health',
          color: '#06b6d4',
          icon: '💧',
          frequencyType: 'daily',
          targetDays: [0, 1, 2, 3, 4, 5, 6],
          timeOfDay: 'anytime',
          targetType: 'numeric',
          targetValue: 2500,
          unit: 'ml',
          createdAt: new Date().toISOString(),
          archived: false
        },
        {
          id: 'h_workout_' + (Date.now() + 1),
          name: 'Gym & Fitness Workout',
          description: 'Scheduled on Mon, Wed, Fri',
          category: 'fitness',
          color: '#ef4444',
          icon: '🏋️',
          frequencyType: 'weekdays',
          targetDays: [1, 3, 5],
          timeOfDay: 'afternoon',
          targetType: 'boolean',
          targetValue: 1,
          unit: 'session',
          createdAt: new Date().toISOString(),
          archived: false
        },
        {
          id: 'h_reading_' + (Date.now() + 2),
          name: 'Read 20 Pages',
          description: 'Daily mind growth & reading',
          category: 'learning',
          color: '#f59e0b',
          icon: '📖',
          frequencyType: 'daily',
          targetDays: [0, 1, 2, 3, 4, 5, 6],
          timeOfDay: 'evening',
          targetType: 'numeric',
          targetValue: 20,
          unit: 'pages',
          createdAt: new Date().toISOString(),
          archived: false
        },
        {
          id: 'h_deepwork_' + (Date.now() + 3),
          name: '90-min Deep Focus Task',
          description: 'Deep productive work with no distractions',
          category: 'productivity',
          color: '#6366f1',
          icon: '💻',
          frequencyType: 'weekdays',
          targetDays: [1, 2, 3, 4, 5],
          timeOfDay: 'morning',
          targetType: 'numeric',
          targetValue: 90,
          unit: 'mins',
          createdAt: new Date().toISOString(),
          archived: false
        },
        {
          id: 'h_meditation_' + (Date.now() + 4),
          name: 'Morning Meditation & Stretch',
          description: 'Mindfulness to start the day',
          category: 'mindfulness',
          color: '#ec4899',
          icon: '🧘',
          frequencyType: 'daily',
          targetDays: [0, 1, 2, 3, 4, 5, 6],
          timeOfDay: 'morning',
          targetType: 'boolean',
          targetValue: 1,
          unit: 'session',
          createdAt: new Date().toISOString(),
          archived: false
        }
      ];

      // Generate realistic logs for the past 14 days
      const initialLogs = {};
      const today = new Date();
      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        initialLogs[dateStr] = {};
        initialHabits.forEach((habit, idx) => {
          // Check if habit was scheduled on this day
          if (habit.targetDays.includes(dayOfWeek)) {
            // High completion rate for demonstration
            const isDone = Math.random() > 0.25 || i === 0;
            if (isDone) {
              initialLogs[dateStr][habit.id] = {
                completed: true,
                value: habit.targetValue,
                completedAt: new Date(d.setHours(9 + idx * 2, 30, 0, 0)).toISOString()
              };
            }
          }
        });
      }

      StorageManager.saveHabits(initialHabits);
      StorageManager.saveLogs(initialLogs);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  static exportDataJSON() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: StorageManager.getHabits(),
      logs: StorageManager.getLogs(),
      settings: StorageManager.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  static importDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.habits && Array.isArray(data.habits)) {
        StorageManager.saveHabits(data.habits);
      }
      if (data.logs && typeof data.logs === 'object') {
        StorageManager.saveLogs(data.logs);
      }
      if (data.settings) {
        StorageManager.saveSettings(data.settings);
      }
      return { success: true, count: data.habits ? data.habits.length : 0 };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }

  static resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    StorageManager.initDefaultDataIfNeeded();
  }
}
