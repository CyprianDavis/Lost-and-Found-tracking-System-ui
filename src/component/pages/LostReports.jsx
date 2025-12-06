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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../common/PageHeader";
import StatusChip from "../common/StatusChip";
import { formatDate, formatDateTime } from "../../lib/formatters";
import { LOST_REPORT_STATUSES } from "../../lib/constants";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";

const emptyReport = {
  userId: "",
  itemId: "",
  locationLost: "",
  dateLost: "",
  extraDescription: "",
};

export default function LostReports() {
  const {
    data: lostReports = [],
    loading,
    error,
    refetch,
    setParams,
  } = useApiList("/api/v1/lost-reports");
  const { data: items = [] } = useApiList("/api/v1/items");
  const { data: users = [] } = useApiList("/api/v1/users");

  const [filters, setFilters] = useState({ status: "", userId: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(emptyReport);
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const itemLookup = useMemo(() => {
    const map = new Map();
    (items || []).forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const userLookup = useMemo(() => {
    const map = new Map();
    (users || []).forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const showInitialLoader = loading && lostReports.length === 0;

  const openDialog = (report) => {
    setEditingReport(report ?? null);
    setFormState(
      report
        ? {
            userId: report.userId?.toString() || "",
            itemId: report.itemId?.toString() || "",
            locationLost: report.locationLost || "",
            dateLost: report.dateLost || "",
            extraDescription: report.extraDescription || "",
          }
        : emptyReport,
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReport(null);
    setFormState(emptyReport);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setParams({
      status: filters.status || undefined,
      userId: filters.userId || undefined,
    });
  };

  const handleStatusChange = async (reportId, status) => {
    setStatusUpdatingId(reportId);
    try {
      await apiRequest(`/api/v1/lost-reports/${reportId}/status`, {
        method: "PATCH",
        params: { status },
      });
      setFeedback({ type: "success", message: "Status updated." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to update." });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this lost report?")) return;
    try {
      await apiRequest(`/api/v1/lost-reports/${reportId}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Lost report removed." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete." });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    if (
      !formState.userId ||
      !formState.itemId ||
      !formState.locationLost ||
      !formState.dateLost
    ) {
      setSaving(false);
      setFeedback({ type: "error", message: "Complete all required fields." });
      return;
    }
    try {
      const payload = {
        userId: Number(formState.userId),
        itemId: Number(formState.itemId),
        locationLost: formState.locationLost,
        dateLost: formState.dateLost,
        extraDescription: formState.extraDescription || null,
      };
      const path = editingReport
        ? `/api/v1/lost-reports/${editingReport.id}`
        : "/api/v1/lost-reports";
      const method = editingReport ? "PUT" : "POST";
      await apiRequest(path, { method, body: payload });
      setFeedback({
        type: "success",
        message: `Lost report ${editingReport ? "updated" : "created"}.`,
      });
      closeDialog();
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Lost Reports"
        subtitle="Log and track reports from students and staff whose items have gone missing."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => openDialog()}
          >
            New Lost Report
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
            {LOST_REPORT_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Reporter ID"
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
              <TableCell>Reference</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Lost On</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lostReports.map((report) => {
              const item = itemLookup.get(report.itemId);
              const user = userLookup.get(report.userId);
              return (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>
                        {report.referenceCode || `L-${report.id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        #{report.id}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {item ? (
                      <Stack spacing={0.5}>
                        <strong>{item.name}</strong>
                        <Typography variant="body2" color="text.secondary">
                          {item.category}
                        </Typography>
                      </Stack>
                    ) : (
                      `Item #${report.itemId}`
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
                      `User #${report.userId}`
                    )}
                  </TableCell>
                  <TableCell>{formatDate(report.dateLost)}</TableCell>
                  <TableCell>{report.locationLost}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <StatusChip value={report.status} />
                      <TextField
                        select
                        size="small"
                        value={report.status}
                        onChange={(event) =>
                          handleStatusChange(report.id, event.target.value)
                        }
                        disabled={statusUpdatingId === report.id}
                      >
                        {LOST_REPORT_STATUSES.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDateTime(report.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit report">
                      <IconButton
                        size="small"
                        onClick={() => openDialog(report)}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete report">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(report.id)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {!showInitialLoader && lostReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No lost reports available.
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
        <DialogTitle>
          {editingReport ? "Edit Lost Report" : "New Lost Report"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Reporter"
              value={formState.userId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, userId: event.target.value }))
              }
              required
              fullWidth
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
              label="Item"
              value={formState.itemId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, itemId: event.target.value }))
              }
              required
              fullWidth
            >
              <MenuItem value="">Select item</MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Location lost"
              value={formState.locationLost}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  locationLost: event.target.value,
                }))
              }
              required
              fullWidth
            />
            <TextField
              label="Date lost"
              type="date"
              value={formState.dateLost}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, dateLost: event.target.value }))
              }
              required
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Extra description"
              multiline
              rows={3}
              value={formState.extraDescription}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  extraDescription: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
