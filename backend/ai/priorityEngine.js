export function calculatePriority(deadlineStr, importance, durationHours = 0) {
  if (!deadlineStr) return 'low';
  
  const deadline = new Date(deadlineStr);
  const now = new Date();
  
  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  // Example Rule-Based Logic
  // If deadline < 24 hours AND importance > 4 => Critical
  // If deadline < 3 days => High
  // If deadline < 7 days => Medium
  // Else => Low
  if (diffHours <= 24 && importance >= 4) {
    return 'critical';
  } else if (diffHours <= 72) { // 3 days
    return 'high';
  } else if (diffHours <= 168) { // 7 days
    return 'medium';
  } else {
    return 'low';
  }
}
