export function getIndianTime(date:Date) {
    const currentTime = new Date(date);
    const utcOffsetInMinutes = 330; // Indian timezone offset is +5:30 (5 hours * 60 minutes + 30 minutes)
    const indianTime = new Date(currentTime.getTime() + utcOffsetInMinutes * 60 * 1000);
    return indianTime;
  }