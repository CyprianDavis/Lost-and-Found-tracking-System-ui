import Chip from "@mui/material/Chip";

const BASE_STYLES = {
  PENDING: { bg: "rgba(251,191,36,0.18)", color: "#b45309" },
  MATCHED: { bg: "rgba(129,140,248,0.18)", color: "#312e81" },
  CLOSED: { bg: "rgba(107,114,128,0.18)", color: "#111827" },
  AVAILABLE: { bg: "rgba(16,185,129,0.18)", color: "#065f46" },
  CLAIM_PENDING: { bg: "rgba(59,130,246,0.18)", color: "#1e3a8a" },
  CLAIMED: { bg: "rgba(129,199,132,0.25)", color: "#1b5e20" },
  ARCHIVED: { bg: "rgba(156,163,175,0.25)", color: "#1f2937" },
  APPROVED: { bg: "rgba(34,197,94,0.18)", color: "#065f46" },
  REJECTED: { bg: "rgba(239,68,68,0.18)", color: "#7f1d1d" },
  CANCELLED: { bg: "rgba(148,163,184,0.18)", color: "#0f172a" },
};

export default function StatusChip({ value, sx }) {
  const normalized = (value || "").toUpperCase();
  const styles = BASE_STYLES[normalized] || {
    bg: "rgba(226,232,240,0.7)",
    color: "#1f2937",
  };

  return (
    <Chip
      label={normalized || "—"}
      size="small"
      sx={{
        bgcolor: styles.bg,
        color: styles.color,
        fontWeight: 600,
        letterSpacing: "0.02em",
        ...sx,
      }}
    />
  );
}
