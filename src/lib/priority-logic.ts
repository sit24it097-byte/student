import { Task, PrioritizedTask, UrgencyCategory } from '../types';
import { differenceInHours, isBefore } from 'date-fns';

export function calculateTaskPriority(task: Task): PrioritizedTask {
  let score = 0;
  const now = new Date();
  
  // 1. Base score from priority level
  switch (task.priority) {
    case 'high': score += 300; break;
    case 'medium': score += 200; break;
    case 'low': score += 100; break;
  }

  // 2. Deadline proximity score
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const hoursToDeadline = differenceInHours(deadlineDate, now);

    if (isBefore(deadlineDate, now)) {
      // Overdue
      score += 500;
    } else if (hoursToDeadline <= 24) {
      // Due within 24 hours
      score += 400;
    } else if (hoursToDeadline <= 72) {
      // Due within 3 days
      score += 200;
    } else if (hoursToDeadline <= 168) {
      // Due within 7 days
      score += 100;
    }
  }

  // 3. Categorization
  let category: UrgencyCategory = 'normal';
  if (score >= 500) {
    category = 'urgent';
  } else if (score >= 300) {
    category = 'important';
  }

  return {
    ...task,
    score,
    category
  };
}

export function sortTasksByPriority(tasks: Task[]): PrioritizedTask[] {
  return tasks
    .map(calculateTaskPriority)
    .sort((a, b) => b.score - a.score);
}
