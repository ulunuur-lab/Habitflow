/**
 * HabitFlow - Habits Logic & Schedule Processing
 */

class HabitManager {
  constructor() {
    this.habits = StorageManager.getHabits();
    this.logs = StorageManager.getLogs();
  }

  refreshState() {
    this.habits = StorageManager.getHabits();
    this.logs = StorageManager.getLogs();
  }

  getAllHabits(includeArchived = false) {
    return includeArchived ? this.habits : this.habits.filter(h => !h.archived);
  }

  getHabitById(id) {
    return this.habits.find(h => h.id === id);
  }

  createHabit(habitData) {
    const newHabit = {
      id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: habitData.name || 'New Habit',
      description: habitData.description || '',
      category: habitData.category || 'routine',
      color: habitData.color || '#6366f1',
      icon: habitData.icon || '✨',
      frequencyType: habitData.frequencyType || 'daily', // 'daily' | 'weekdays' | 'weekly_target' | 'specific_date'
      targetDays: habitData.targetDays || [0, 1, 2, 3, 4, 5, 6],
      weeklyTargetCount: habitData.weeklyTargetCount || 3,
      specificDate: habitData.specificDate || null,
      timeOfDay: habitData.timeOfDay || 'anytime', // 'morning' | 'afternoon' | 'evening' | 'anytime'
      targetType: habitData.targetType || 'boolean', // 'boolean' | 'numeric'
      targetValue: habitData.targetValue || 1,
      unit: habitData.unit || 'times',
      createdAt: new Date().toISOString(),
      archived: false
    };

    this.habits.push(newHabit);
    StorageManager.saveHabits(this.habits);
    return newHabit;
  }

  updateHabit(id, updatedData) {
    const index = this.habits.findIndex(h => h.id === id);
    if (index === -1) return null;

    this.habits[index] = {
      ...this.habits[index],
      ...updatedData
    };

    StorageManager.saveHabits(this.habits);
    return this.habits[index];
  }

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    StorageManager.saveHabits(this.habits);

    // Clean up logs for this habit
    let modified = false;
    for (const date in this.logs) {
      if (this.logs[date][id]) {
        delete this.logs[date][id];
        modified = true;
      }
    }
    if (modified) {
      StorageManager.saveLogs(this.logs);
    }
  }

  toggleArchiveHabit(id) {
    const habit = this.getHabitById(id);
    if (habit) {
      habit.archived = !habit.archived;
      StorageManager.saveHabits(this.habits);
    }
    return habit;
  }

  /**
   * Check if a habit is scheduled for a specific date (YYYY-MM-DD)
   */
  isScheduledForDate(habit, dateStr) {
    if (habit.archived) return false;

    // Check creation date - only show if created on or before this date (compare YYYY-MM-DD)
    const habitCreatedDate = habit.createdAt ? habit.createdAt.split('T')[0] : '2000-01-01';
    if (dateStr < habitCreatedDate) {
      return false;
    }

    if (habit.frequencyType === 'specific_date') {
      return habit.specificDate === dateStr;
    }

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon, etc.

    if (habit.frequencyType === 'daily') {
      return true;
    }

    if (habit.frequencyType === 'weekdays') {
      return habit.targetDays.includes(dayOfWeek);
    }

    if (habit.frequencyType === 'weekly_target') {
      return true; // Visible every day during the week for tracking
    }

    return true;
  }

  /**
   * Get habits scheduled for a given date
   */
  getHabitsForDate(dateStr) {
    return this.getAllHabits(false).filter(h => this.isScheduledForDate(h, dateStr));
  }

  /**
   * Get log status of a habit for a given date
   */
  getLog(habitId, dateStr) {
    if (this.logs[dateStr] && this.logs[dateStr][habitId]) {
      return this.logs[dateStr][habitId];
    }
    return { completed: false, value: 0 };
  }

  /**
   * Toggle or set completion status
   */
  toggleCompletion(habitId, dateStr, specificValue = null) {
    const habit = this.getHabitById(habitId);
    if (!habit) return false;

    if (!this.logs[dateStr]) {
      this.logs[dateStr] = {};
    }

    const currentLog = this.logs[dateStr][habitId] || { completed: false, value: 0 };

    if (habit.targetType === 'boolean') {
      const newStatus = !currentLog.completed;
      this.logs[dateStr][habitId] = {
        completed: newStatus,
        value: newStatus ? 1 : 0,
        completedAt: newStatus ? new Date().toISOString() : null
      };
    } else {
      // Numeric target
      if (specificValue !== null) {
        const val = Math.max(0, specificValue);
        const isDone = val >= habit.targetValue;
        this.logs[dateStr][habitId] = {
          completed: isDone,
          value: val,
          completedAt: isDone ? (currentLog.completedAt || new Date().toISOString()) : null
        };
      } else {
        // Toggle full completion
        const isDone = !currentLog.completed;
        this.logs[dateStr][habitId] = {
          completed: isDone,
          value: isDone ? habit.targetValue : 0,
          completedAt: isDone ? new Date().toISOString() : null
        };
      }
    }

    StorageManager.saveLogs(this.logs);
    return this.logs[dateStr][habitId];
  }

  /**
   * Add delta to numeric habit (e.g. +250ml water)
   */
  incrementValue(habitId, dateStr, delta) {
    const habit = this.getHabitById(habitId);
    if (!habit) return;

    if (!this.logs[dateStr]) {
      this.logs[dateStr] = {};
    }

    const currentLog = this.logs[dateStr][habitId] || { completed: false, value: 0 };
    const newValue = Math.max(0, (currentLog.value || 0) + delta);
    const isDone = newValue >= habit.targetValue;

    this.logs[dateStr][habitId] = {
      completed: isDone,
      value: newValue,
      completedAt: isDone ? (currentLog.completedAt || new Date().toISOString()) : null
    };

    StorageManager.saveLogs(this.logs);
    return this.logs[dateStr][habitId];
  }
}
