import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import PageHeader from "../common/PageHeader";
import StatusChip from "../common/StatusChip";
import { CLAIM_STATUSES } from "../../lib/constants";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";
import { formatDateTime } from "../../lib/formatters";

const emptyClaim = {
  userId: "",
  foundReportId: "",
  reason: "",
  verificationAnswer: "",
};

const emptyReview = {
  status: "",
  reviewerId: "",
  reviewNotes: "",
};

export default function Claims() {
  const {
    data: claims = [],
    loading,
    error,
    refetch,
    setParams,
  } = useApiList("/api/v1/claims");
  const { data: users = [] } = useApiList("/api/v1/users");
  const { data: foundReports = [] } = useApiList("/api/v1/found-reports");

  const [filters, setFilters] = useState({ status: "", userId: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(emptyClaim);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [reviewDialog, setReviewDialog] = useState({ open: false, claim: null });
  const [reviewState, setReviewState] = useState(emptyReview);
  const [reviewSaving, setReviewSaving] = useState(false);

  const userLookup = useMemo(() => {
    const map = new Map();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const foundLookup = useMemo(() => {
    const map = new Map();
    foundReports.forEach((report) => map.set(report.id, report));
    return map;
  }, [foundReports]);

  const showInitialLoader = loading && claims.length === 0;

  const openDialog = () => {
    setFormState(emptyClaim);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormState(emptyClaim);
  };

  const openReviewDialog = (claim) => {
    setReviewDialog({ open: true, claim });
    setReviewState({
      status: claim.status,
      reviewerId: claim.reviewedById?.toString() || "",
      reviewNotes: claim.reviewNotes || "",
    });
  };

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, claim: null });
    setReviewState(emptyReview);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setParams({
      status: filters.status || undefined,
      userId: filters.userId || undefined,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    if (!formState.userId || !formState.foundReportId || !formState.reason) {
      setSaving(false);
      setFeedback({
        type: "error",
        message: "Select claimant, found report, and provide a reason.",
      });
      return;
    }
    try {
      const payload = {
        userId: Number(formState.userId),
        foundReportId: Number(formState.foundReportId),
        reason: formState.reason,
        verificationAnswer: formState.verificationAnswer || null,
      };
      await apiRequest("/api/v1/claims", { method: "POST", body: payload });
      setFeedback({ type: "success", message: "Claim submitted." });
      closeDialog();
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (claimId) => {
    if (!window.confirm("Delete this claim?")) return;
    try {
      await apiRequest(`/api/v1/claims/${claimId}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Claim removed." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete." });
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewDialog.claim) return;
    if (!reviewState.status || !reviewState.reviewerId) {
      setFeedback({
        type: "error",
        message: "Select both status and reviewer for the decision.",
      });
      return;
    }
    setReviewSaving(true);
    setFeedback(null);
    try {
      await apiRequest(`/api/v1/claims/${reviewDialog.claim.id}/status`, {
        method: "PATCH",
        params: {
          status: reviewState.status,
          reviewerId: reviewState.reviewerId,
          reviewNotes: reviewState.reviewNotes || undefined,
        },
      });
      setFeedback({ type: "success", message: "Claim reviewed." });
      closeReviewDialog();
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Review failed." });
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Claims"
        subtitle="Coordinate the ownership verification and approval workflow."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openDialog}
          >
            New Claim
          </Button>
        }
      />

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleFilterSubmit}
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-end" }}
        >
          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, status: event.target.value }))
            }
            fullWidth
          >
            <MenuItem value="">All statuses</MenuItem>
            {CLAIM_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Claimant ID"
            value={filters.userId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, userId: event.target.value }))
            }
            fullWidth
          />
          <Button type="submit" variant="outlined">
            Apply filters
          </Button>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Claim</TableCell>
              <TableCell>Found Report</TableCell>
              <TableCell>Claimant</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Reviewer</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map((claim) => {
              const user = userLookup.get(claim.userId);
              const found = foundLookup.get(claim.foundReportId);
              const reviewer = claim.reviewedById
                ? userLookup.get(claim.reviewedById)
                : null;
              return (
                <TableRow key={claim.id} hover>
                  <TableCell>#{claim.id}</TableCell>
                  <TableCell>
                    {found ? (
                      <Stack spacing={0.5}>
                        <strong>{found.referenceCode || `F-${found.id}`}</strong>
                        <Typography variant="body2" color="text.secondary">
                          Item #{found.itemId}
                        </Typography>
                      </Stack>
                    ) : (
                      `Found report #${claim.foundReportId}`
                    )}
                  </TableCell>
                  <TableCell>
                    {user ? (
                      <Stack spacing={0.5}>
                        <strong>{user.fullName}</strong>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Stack>
                    ) : (
                      `User #${claim.userId}`
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2">{claim.reason}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={claim.status} />
                  </TableCell>
                  <TableCell>{formatDateTime(claim.createdAt)}</TableCell>
                  <TableCell>
                    {reviewer ? (
                      <Stack spacing={0.5}>
                        <strong>{reviewer.fullName}</strong>
                        <Typography variant="body2" color="text.secondary">
                          {claim.reviewNotes || "No notes"}
                        </Typography>
                      </Stack>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Review claim">
                      <IconButton
                        size="small"
                        onClick={() => openReviewDialog(claim)}
                      >
                        <RuleRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete claim">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(claim.id)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {!showInitialLoader && claims.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No claims available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {showInitialLoader && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Submit Claim</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Claimant"
              value={formState.userId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, userId: event.target.value }))
              }
              required
            >
              <MenuItem value="">Select user</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName} ({user.role})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Found report"
              value={formState.foundReportId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  foundReportId: event.target.value,
                }))
              }
              required
            >
              <MenuItem value="">Select found report</MenuItem>
              {foundReports.map((report) => (
                <MenuItem key={report.id} value={report.id}>
                  {report.referenceCode || `F-${report.id}`} (Item #{report.itemId})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason"
              value={formState.reason}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, reason: event.target.value }))
              }
              required
              multiline
              rows={3}
            />
            <TextField
              label="Verification answer"
              value={formState.verificationAnswer}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  verificationAnswer: event.target.value,
                }))
              }
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialog.open}
        onClose={closeReviewDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Review Claim #{reviewDialog.claim?.id}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Status"
              value={reviewState.status}
              onChange={(event) =>
                setReviewState((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
              required
            >
              {CLAIM_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Reviewer"
              value={reviewState.reviewerId}
              onChange={(event) =>
                setReviewState((prev) => ({
                  ...prev,
                  reviewerId: event.target.value,
                }))
              }
              required
            >
              <MenuItem value="">Select reviewer</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName} ({user.role})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Review notes"
              value={reviewState.reviewNotes}
              onChange={(event) =>
                setReviewState((prev) => ({
                  ...prev,
                  reviewNotes: event.target.value,
                }))
              }
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReviewDialog}>Cancel</Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={reviewSaving}
          >
            {reviewSaving ? "Saving..." : "Save decision"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
