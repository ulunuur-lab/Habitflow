/**
 * HabitFlow - SVG Interactive Chart Renderer
 */

class ChartRenderer {
  /**
   * Render SVG Circular Progress Ring
   */
  static renderProgressRing(containerId, percentage, size = 120, strokeWidth = 10, color = '#6366f1') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    container.innerHTML = `
      <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
        <svg width="${size}" height="${size}" class="transform -rotate-90">
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke="currentColor"
            stroke-width="${strokeWidth}"
            class="text-gray-200 dark:text-gray-700"
            fill="transparent"
          />
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke="${color}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${strokeDashoffset}"
            stroke-linecap="round"
            fill="transparent"
            class="progress-ring-circle"
          />
        </svg>
        <div class="absolute flex flex-col items-center justify-center">
          <span class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">${percentage}%</span>
          <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Done</span>
        </div>
      </div>
    `;
  }

  /**
   * Render 7-Day Performance Bar Chart
   */
  static renderWeeklyBarChart(containerId, weekData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    let barsHtml = weekData.map((day, idx) => {
      const heightPercent = day.total > 0 ? Math.max(8, day.percentage) : 8;
      const isToday = day.isToday;
      const barColor = day.percentage === 100 ? 'bg-emerald-500' : (day.percentage >= 50 ? 'bg-indigo-500' : (day.total === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-amber-400'));

      return `
        <div class="flex-1 flex flex-col items-center gap-2 group cursor-pointer" title="${day.date}: ${day.completed}/${day.total} (${day.percentage}%)">
          <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">
            ${day.percentage}%
          </div>
          <div class="w-full max-w-[28px] h-32 bg-gray-100 dark:bg-gray-800 rounded-t-lg relative flex items-end p-1">
            <div class="w-full ${barColor} rounded-t-md transition-all duration-500 ease-out" style="height: ${heightPercent}%;"></div>
          </div>
          <span class="text-xs font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-600 dark:text-gray-400'}">
            ${dayLabels[idx]}
          </span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex items-end justify-between gap-2 h-44 pt-2">
        ${barsHtml}
      </div>
    `;
  }

  /**
   * Render GitHub-style Activity Heatmap Matrix
   */
  static renderHeatmap(containerId, daysData, onCellClick = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Group into 7 rows (days of week) and columns (weeks)
    const weeks = [];
    let currentWeek = [];

    daysData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === daysData.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    let weeksHtml = weeks.map(week => {
      const cellsHtml = week.map(day => {
        const tooltip = `${day.date}: ${day.completed}/${day.total} completed (${day.percentage}%)`;
        return `
          <div 
            class="heatmap-cell level-${day.level} ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-900' : ''}" 
            data-date="${day.date}" 
            title="${tooltip}"
          ></div>
        `;
      }).join('');

      return `<div class="flex flex-col gap-1.5">${cellsHtml}</div>`;
    }).join('');

    container.innerHTML = `
      <div class="overflow-x-auto pb-2">
        <div class="flex items-center gap-1.5 min-w-max">
          <div class="flex flex-col gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-mono pr-2 justify-between h-[116px]">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
          <div class="flex gap-1.5">
            ${weeksHtml}
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span>Less</span>
        <div class="flex items-center gap-1.5">
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
        </div>
        <span>More Active</span>
      </div>
    `;

    // Add click listeners to cells
    if (onCellClick) {
      container.querySelectorAll('.heatmap-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const date = cell.getAttribute('data-date');
          if (date) onCellClick(date);
        });
      });
    }
  }
}
