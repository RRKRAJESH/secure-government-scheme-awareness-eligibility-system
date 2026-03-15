const IST_TIMEZONE = "Asia/Kolkata";
const IST_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} IST$/;
const IST_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP_KEYS = new Set([
  "posted_at",
  "commented_at",
  "created_at",
  "updated_at",
  "postedAt",
  "commentedAt",
  "createdAt",
  "updatedAt",
]);

const getDateParts = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return null;
  return { year, month, day };
};

export const formatDateIST = (value) => {
  if (typeof value === "string" && IST_DATE_TIME_PATTERN.test(value)) {
    return value.slice(0, 10);
  }
  if (typeof value === "string" && IST_DATE_PATTERN.test(value)) {
    return value;
  }

  const parts = getDateParts(value);
  if (!parts) return "-";
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const formatTimeIST = (value) => {
  if (typeof value === "string" && IST_DATE_TIME_PATTERN.test(value)) {
    return value.slice(11, 19);
  }

  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatDateTimeIST = (value) => {
  if (typeof value === "string" && IST_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  const formattedDate = formatDateIST(value);
  const formattedTime = formatTimeIST(value);

  if (formattedDate === "-" || formattedTime === "-") return "-";
  return `${formattedDate} ${formattedTime} IST`;
};

export const normalizeApiTimestampsToIST = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeApiTimestampsToIST(item));
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (TIMESTAMP_KEYS.has(key) && value) {
      accumulator[key] = formatDateTimeIST(value);
      return accumulator;
    }

    accumulator[key] = normalizeApiTimestampsToIST(value);
    return accumulator;
  }, {});
};
