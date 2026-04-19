const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const formatIndian = (value: number) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;

function getIstDate(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

export const formatDashboardDate = (date: Date) => {
  const istDate = getIstDate(date);
  return `${WEEKDAYS[istDate.getUTCDay()]}, ${istDate.getUTCDate()} ${MONTHS[istDate.getUTCMonth()]} ${istDate.getUTCFullYear()}`;
};

export const formatDashboardTime = (date: Date) => {
  const istDate = getIstDate(date);
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function getGreeting(date: Date) {
  const hour = getIstDate(date).getUTCHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function shortDateLabel(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${day}`;
}

export function weekdayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAYS_SHORT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
