/**
 * HabitFlow - Analytics & Progress Engine
 */

class AnalyticsEngine {
  constructor(habitManager) {
    this.habitManager = habitManager;
  }

  /**
   * Calculate current streak and longest streak for a specific habit
   */
  calculateHabitStreak(habitId) {
    const habit = this.habitManager.getHabitById(habitId);
    if (!habit) return { current: 0, longest: 0, total: 0 };

    const logs = this.habitManager.logs;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCompleted = 0;

    // Count all historical completions
    for (const date in logs) {
      if (logs[date][habitId] && logs[date][habitId].completed) {
        totalCompleted++;
      }
    }

    // Iterate backwards starting from today (or yesterday if today is not yet done)
    let checkDate = new Date(today);
    const todayStr = this.formatDate(checkDate);
    const todayLog = logs[todayStr] && logs[todayStr][habitId];
    const isTodayScheduled = this.habitManager.isScheduledForDate(habit, todayStr);

    if (isTodayScheduled && (!todayLog || !todayLog.completed)) {
      // Check if yesterday was completed
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Compute current streak going backwards
    let safetyCounter = 0;
    while (safetyCounter < 365) {
      safetyCounter++;
      const dateStr = this.formatDate(checkDate);
      const isScheduled = this.habitManager.isScheduledForDate(habit, dateStr);

      if (isScheduled) {
        const log = logs[dateStr] && logs[dateStr][habitId];
        if (log && log.completed) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        // If not scheduled on this day, skip day without breaking streak
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate longest streak over the past 365 days
    let scanDate = new Date(today);
    scanDate.setDate(scanDate.getDate() - 365);

    for (let i = 0; i <= 365; i++) {
      const dateStr = this.formatDate(scanDate);
      const isScheduled = this.habitManager.isScheduledForDate(habit, dateStr);

      if (isScheduled) {
        const log = logs[dateStr] && logs[dateStr][habitId];
        if (log && log.completed) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }
      scanDate.setDate(scanDate.getDate() + 1);
    }

    return {
      current: currentStreak,
      longest: Math.max(longestStreak, currentStreak),
      total: totalCompleted
    };
  }

  /**
   * Get completion statistics for a specific single date
   */
  getDayStats(dateStr) {
    const habits = this.habitManager.getHabitsForDate(dateStr);
    if (habits.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    let completed = 0;
    habits.forEach(h => {
      const log = this.habitManager.getLog(h.id, dateStr);
      if (log.completed) completed++;
    });

    return {
      total: habits.length,
      completed,
      percentage: Math.round((completed / habits.length) * 100)
    };
  }

  /**
   * Get completion statistics for a week starting on a given Monday/Sunday
   */
  getWeekStats(startDateStr) {
    const start = new Date(startDateStr + 'T00:00:00');
    let totalScheduled = 0;
    let totalCompleted = 0;

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = this.formatDate(current);

      const dayStats = this.getDayStats(dateStr);
      totalScheduled += dayStats.total;
      totalCompleted += dayStats.completed;
    }

    const percentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    return {
      total: totalScheduled,
      completed: totalCompleted,
      percentage
    };
  }

  /**
   * Get monthly statistics
   */
  getMonthStats(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalScheduled = 0;
    let totalCompleted = 0;
    let perfectDays = 0;
    let activeDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const dayStats = this.getDayStats(dateStr);

      if (dayStats.total > 0) {
        totalScheduled += dayStats.total;
        totalCompleted += dayStats.completed;
        if (dayStats.completed > 0) activeDays++;
        if (dayStats.completed === dayStats.total && dayStats.total > 0) perfectDays++;
      }
    }

    const percentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    return {
      total: totalScheduled,
      completed: totalCompleted,
      percentage,
      perfectDays,
      activeDays,
      daysInMonth
    };
  }

  /**
   * Generate activity heatmap grid data (last N days)
   */
  getHeatmapData(weeksCount = 16) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = weeksCount * 7;
    const days = [];

    // Find the end day (closest Saturday or Sunday)
    const endDay = new Date(today);
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - totalDays + 1);

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(startDay);
      cur.setDate(startDay.getDate() + i);
      const dateStr = this.formatDate(cur);
      const dayStats = this.getDayStats(dateStr);

      let level = 0;
      if (dayStats.total > 0) {
        if (dayStats.completed === 0) level = 0;
        else if (dayStats.percentage < 40) level = 1;
        else if (dayStats.percentage < 70) level = 2;
        else if (dayStats.percentage < 100) level = 3;
        else level = 4;
      }

      days.push({
        date: dateStr,
        dayOfWeek: cur.getDay(),
        total: dayStats.total,
        completed: dayStats.completed,
        percentage: dayStats.percentage,
        level,
        isToday: dateStr === this.formatDate(today),
        isFuture: cur > today
      });
    }

    return days;
  }

  /**
   * Category breakdown & adherence rates
   */
  getCategoryBreakdown(daysBack = 30) {
    const categories = {
      health: { label: 'Health & Hydration', color: '#06b6d4', scheduled: 0, completed: 0 },
      productivity: { label: 'Productivity & Work', color: '#6366f1', scheduled: 0, completed: 0 },
      mindfulness: { label: 'Mindfulness & Peace', color: '#ec4899', scheduled: 0, completed: 0 },
      fitness: { label: 'Fitness & Sports', color: '#f97316', scheduled: 0, completed: 0 },
      learning: { label: 'Learning & Books', color: '#eab308', scheduled: 0, completed: 0 },
      routine: { label: 'Daily Routine', color: '#8b5cf6', scheduled: 0, completed: 0 }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysBack; i++) {
      const cur = new Date(today);
      cur.setDate(today.getDate() - i);
      const dateStr = this.formatDate(cur);

      const habits = this.habitManager.getHabitsForDate(dateStr);
      habits.forEach(h => {
        const cat = h.category || 'routine';
        if (categories[cat]) {
          categories[cat].scheduled++;
          const log = this.habitManager.getLog(h.id, dateStr);
          if (log.completed) {
            categories[cat].completed++;
          }
        }
      });
    }

    return Object.keys(categories).map(key => {
      const cat = categories[key];
      const rate = cat.scheduled > 0 ? Math.round((cat.completed / cat.scheduled) * 100) : 0;
      return {
        id: key,
        ...cat,
        rate
      };
    });
  }

  /**
   * Calculate milestone badges
   */
  getMilestones() {
    let maxStreakAllHabits = 0;
    let totalAllCompletions = 0;
    const habits = this.habitManager.getAllHabits(true);

    habits.forEach(h => {
      const streak = this.calculateHabitStreak(h.id);
      if (streak.longest > maxStreakAllHabits) maxStreakAllHabits = streak.longest;
      totalAllCompletions += streak.total;
    });

    const badges = [
      {
        id: 'first_step',
        title: '🌱 First Step',
        desc: 'Completed your first routine task',
        unlocked: totalAllCompletions >= 1,
        progress: `${Math.min(totalAllCompletions, 1)}/1`
      },
      {
        id: 'three_days',
        title: '🔥 3-Day Momentum',
        desc: 'Maintained a 3-day continuous streak',
        unlocked: maxStreakAllHabits >= 3,
        progress: `${Math.min(maxStreakAllHabits, 3)}/3 days`
      },
      {
        id: 'seven_days',
        title: '⚡ 7-Day Champion',
        desc: 'Unbroken full week streak',
        unlocked: maxStreakAllHabits >= 7,
        progress: `${Math.min(maxStreakAllHabits, 7)}/7 days`
      },
      {
        id: 'atomic_21',
        title: '🧬 21-Day Habit Master',
        desc: 'Formed a lasting neural habit loop',
        unlocked: maxStreakAllHabits >= 21,
        progress: `${Math.min(maxStreakAllHabits, 21)}/21 days`
      },
      {
        id: 'century_100',
        title: '👑 Century Club',
        desc: 'Completed over 100 total habit sessions',
        unlocked: totalAllCompletions >= 100,
        progress: `${Math.min(totalAllCompletions, 100)}/100`
      }
    ];

    return {
      maxStreak: maxStreakAllHabits,
      totalCompletions: totalAllCompletions,
      badges
    };
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
