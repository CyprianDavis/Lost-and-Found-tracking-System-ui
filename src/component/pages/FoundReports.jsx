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
  TablePagination,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../common/PageHeader";
import StatusChip from "../common/StatusChip";
import { FOUND_REPORT_STATUSES } from "../../lib/constants";
import { toOptionalString } from "../../lib/itemForm";
import { formatDate, formatDateTime } from "../../lib/formatters";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";

const emptyReport = {
  lostReferenceCode: "",
  locationFound: "",
  dateFound: "",
  storageLocation: "",
  extraDescription: "",
};

const createSelfFoundForm = () => ({
  lostReferenceCode: "",
  locationFound: "",
  dateFound: "",
  storageLocation: "",
  extraDescription: "",
});

export default function FoundReports({ currentUserId, permissions = [] }) {
  const canManageUsers =
    Array.isArray(permissions) && permissions.includes("MANAGE_USERS");
  const {
    data: foundReports = [],
    page: pageData,
    loading,
    error,
    setParams,
    refetch,
  } = useApiList("/api/v1/found-reports", { page: 0, size: 10 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data: items = [] } = useApiList("/api/v1/items");
  const { data: users = [] } = useApiList(
    "/api/v1/users",
    undefined,
    { enabled: canManageUsers },
  );

  const [filters, setFilters] = useState({ keyword: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(emptyReport);
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selfReportForm, setSelfReportForm] = useState(createSelfFoundForm);
  const [selfFeedback, setSelfFeedback] = useState(null);
  const [selfSubmitting, setSelfSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const actionLabel = canManageUsers ? "New Found Report" : "Report Found Item";

  const itemLookup = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const userLookup = useMemo(() => {
    const map = new Map();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const showInitialLoader = loading && foundReports.length === 0;

  const openDialog = (report) => {
    if (!canManageUsers) {
      setEditingReport(null);
      setSelfReportForm(createSelfFoundForm());
      setSelfFeedback(null);
      setSelfSubmitting(false);
      setDialogOpen(true);
      return;
    }
    setEditingReport(report ?? null);
    setFormState(
      report
        ? {
            lostReferenceCode: "",
            locationFound: report.locationFound || "",
            dateFound: report.dateFound || "",
            storageLocation: report.storageLocation || "",
            extraDescription: report.extraDescription || "",
          }
        : { ...emptyReport },
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingReport(null);
    setFormState(emptyReport);
    setDialogOpen(false);
    setSelfReportForm(createSelfFoundForm());
    setSelfFeedback(null);
    setSelfSubmitting(false);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
  };

  React.useEffect(() => {
    const keyword = filters.keyword.trim();
    setParams((prev) => ({
      ...prev,
      page,
      size: rowsPerPage,
      keyword: keyword || undefined,
    }));
  }, [filters.keyword, page, rowsPerPage, setParams]);

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = async (reportId, status) => {
    setStatusUpdatingId(reportId);
    try {
      await apiRequest(`/api/v1/found-reports/${reportId}/status`, {
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

  const handleDelete = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/v1/found-reports/${reportToDelete.id}`, {
        method: "DELETE",
      });
      setFeedback({ type: "success", message: "Found report removed." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete." });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    if (
      !formState.locationFound ||
      !formState.dateFound ||
      (!editingReport && !formState.lostReferenceCode)
    ) {
      setSaving(false);
      setFeedback({
        type: "error",
        message: "Reference code, location, and date found are required.",
      });
      return;
    }
    try {
      const payload = {
        locationFound: formState.locationFound,
        dateFound: formState.dateFound,
        lostReferenceCode: toOptionalString(formState.lostReferenceCode),
        storageLocation: toOptionalString(formState.storageLocation),
        extraDescription: toOptionalString(formState.extraDescription),
      };
      const path = editingReport
        ? `/api/v1/found-reports/${editingReport.id}`
        : "/api/v1/found-reports";
      const method = editingReport ? "PUT" : "POST";
      await apiRequest(path, { method, body: payload });
      setFeedback({
        type: "success",
        message: `Found report ${editingReport ? "updated" : "created"}.`,
      });
      closeDialog();
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleSelfFieldChange = (field) => (event) => {
    const value = event.target.value;
    setSelfReportForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelfSubmit = async (event) => {
    event.preventDefault();
    if (!currentUserId) {
      setSelfFeedback({
        type: "error",
        message: "Session expired. Please sign out and back in.",
      });
      return;
    }
    try {
      setSelfSubmitting(true);
      setSelfFeedback(null);
      const lostReferenceCode = toOptionalString(selfReportForm.lostReferenceCode);
      const locationFound = toOptionalString(selfReportForm.locationFound);
      const dateFound = toOptionalString(selfReportForm.dateFound);
      if (!lostReferenceCode || !locationFound || !dateFound) {
        throw new Error("Reference code, location, and date found are required.");
      }
      await apiRequest("/api/v1/found-reports", {
        method: "POST",
        body: {
          lostReferenceCode,
          locationFound,
          dateFound,
          extraDescription: toOptionalString(selfReportForm.extraDescription),
          storageLocation: toOptionalString(selfReportForm.storageLocation),
        },
      });
      setFeedback({
        type: "success",
        message: "Found report submitted successfully.",
      });
      closeDialog();
      refetch();
    } catch (err) {
      setSelfFeedback({
        type: "error",
        message: err.message || "Failed to submit found report.",
      });
    } finally {
      setSelfSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Found Reports"
        subtitle="Document each recovered item and keep track of custody and storage."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => openDialog()}
          >
            {actionLabel}
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
            label="Search"
            placeholder="Location, reference, item name..."
            value={filters.keyword}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, keyword: event.target.value }))
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
              <TableCell>Finder</TableCell>
              <TableCell>Found On</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Storage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              {canManageUsers && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {foundReports.map((report) => {
              const item = itemLookup.get(report.itemId);
              const user = userLookup.get(report.userId);
              return (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>
                        {report.referenceCode || `F-${report.id}`}
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
                  <TableCell>{formatDate(report.dateFound)}</TableCell>
                  <TableCell>{report.locationFound}</TableCell>
                  <TableCell>{report.storageLocation || "—"}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <StatusChip value={report.status} />
                      {canManageUsers && (
                        <TextField
                          select
                          size="small"
                          value={report.status}
                          onChange={(event) =>
                            handleStatusChange(report.id, event.target.value)
                          }
                          disabled={statusUpdatingId === report.id}
                        >
                          {FOUND_REPORT_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDateTime(report.updatedAt)}</TableCell>
                  {canManageUsers && (
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
                          onClick={() => handleDelete(report)}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {!showInitialLoader && foundReports.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManageUsers ? 9 : 8}
                  align="center"
                >
                  No found reports available.
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
        <TablePagination
          component="div"
          count={pageData?.totalElements ?? foundReports.length}
          page={pageData?.number ?? page}
          onPageChange={handlePageChange}
          rowsPerPage={pageData?.size ?? rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {canManageUsers
            ? editingReport
              ? "Edit Found Report"
              : "New Found Report"
            : "Report Found Item"}
        </DialogTitle>
        <DialogContent dividers>
          {canManageUsers ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Lost report reference code"
                value={formState.lostReferenceCode}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    lostReferenceCode: event.target.value,
                  }))
                }
                required={!editingReport}
                fullWidth
                placeholder="e.g., LST-20240215-1234"
              />
              <TextField
                label="Location found"
                value={formState.locationFound}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    locationFound: event.target.value,
                  }))
                }
                required
                fullWidth
              />
              <TextField
                label="Date found"
                type="date"
                value={formState.dateFound}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    dateFound: event.target.value,
                  }))
                }
                required
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Storage location"
                value={formState.storageLocation}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    storageLocation: event.target.value,
                  }))
                }
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
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {selfFeedback && (
                <Alert
                  severity={selfFeedback.type}
                  onClose={() => setSelfFeedback(null)}
                >
                  {selfFeedback.message}
                </Alert>
              )}
              <TextField
                label="Lost report reference code"
                value={selfReportForm.lostReferenceCode}
                onChange={handleSelfFieldChange("lostReferenceCode")}
                required
                fullWidth
                placeholder="e.g., LST-20240215-1234"
              />
              <TextField
                label="Location found"
                value={selfReportForm.locationFound}
                onChange={handleSelfFieldChange("locationFound")}
                required
                fullWidth
              />
              <TextField
                label="Date found"
                type="date"
                value={selfReportForm.dateFound}
                onChange={handleSelfFieldChange("dateFound")}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Storage location"
                value={selfReportForm.storageLocation}
                onChange={handleSelfFieldChange("storageLocation")}
                fullWidth
              />
              <TextField
                label="Extra description"
                value={selfReportForm.extraDescription}
                onChange={handleSelfFieldChange("extraDescription")}
                multiline
                rows={3}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          {canManageUsers ? (
            <Button onClick={handleSubmit} variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button
              onClick={handleSelfSubmit}
              variant="contained"
              disabled={selfSubmitting}
            >
              {selfSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setReportToDelete(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Found Report</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete found report #
            {reportToDelete?.id}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setReportToDelete(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirmed}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
