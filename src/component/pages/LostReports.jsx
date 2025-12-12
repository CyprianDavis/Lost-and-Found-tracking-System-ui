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

import { formatDate, formatDateTime } from "../../lib/formatters";
import { createItemState } from "../../lib/itemForm";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";

// -----------------------------------------------------
//  Helper to convert backend byte[] → Data URL
// -----------------------------------------------------
const convertBytesToDataURL = (byteArray) => {
  console.debug("[DEBUG] convertBytesToDataURL INPUT:", byteArray);

  if (!byteArray || !Array.isArray(byteArray)) {
    console.debug("[DEBUG] Returning empty string - No image stored.");
    return "";
  }

  const binary = new Uint8Array(byteArray).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ""
  );

  const result = `data:image/png;base64,${btoa(binary)}`;

  console.debug(
    "[DEBUG] convertBytesToDataURL OUTPUT:",
    result.substring(0, 50) + "..."
  );

  return result;
};

// -----------------------------------------------------
//      DEFAULT REPORT FORM STATE
// -----------------------------------------------------
const createReportForm = () => ({
  item: createItemState(),
  locationLost: "",
  dateLost: "",
  extraDescription: "",
});

// -----------------------------------------------------
//  Helper: Ensure image data is in correct format for backend
// -----------------------------------------------------
const prepareImageDataForBackend = (imageData) => {
  if (!imageData) {
    console.debug("[DEBUG] No image data to prepare");
    return null;
  }

  console.debug(
    "[DEBUG] Original image data:",
    imageData.substring(0, 100) + "..."
  );

  // If it's already a data URL (starts with data:), return it as-is
  if (imageData.startsWith("data:")) {
    console.debug("[DEBUG] Image is already data URL format");
    return imageData;
  }

  // If it's just base64 (from file upload), convert to data URL
  // Try to detect mime type from the base64 or default to image/png
  const dataURL = `data:image/png;base64,${imageData}`;
  console.debug(
    "[DEBUG] Converted to data URL:",
    dataURL.substring(0, 100) + "..."
  );

  return dataURL;
};

// -----------------------------------------------------
//  Helper: Build Item Payload for API
// -----------------------------------------------------
const buildItemPayload = (itemState) => {
  const payload = {
    name: itemState.name?.trim() || "",
    category: itemState.category?.trim() || "",
    brand: itemState.brand?.trim() || "",
    color: itemState.color?.trim() || "",
    description: itemState.description?.trim() || "",
    serialNumber: itemState.serialNumber?.trim() || "",
    identifierMarkings: itemState.identifierMarkings?.trim() || "",
  };

  // Handle image data - ensure it's in data URL format for backend
  if (itemState.imageData) {
    const preparedImageData = prepareImageDataForBackend(itemState.imageData);
    if (preparedImageData) {
      payload.imageData = preparedImageData;
      console.debug(
        "[DEBUG] Image data prepared for API (first 100 chars):",
        preparedImageData.substring(0, 100) + "..."
      );
    }
  } else {
    // Send null if no image
    payload.imageData = null;
  }

  return payload;
};

// -----------------------------------------------------
//       MAIN COMPONENT
// -----------------------------------------------------
export default function LostReports({ currentUserId, permissions = [] }) {
  const canManageUsers =
    Array.isArray(permissions) && permissions.includes("MANAGE_USERS");

  const {
    data: lostReports = [],
    page: pageData,
    loading,
    error,
    setParams,
    params,
    refetch,
  } = useApiList("/api/v1/lost-reports", { page: 0, size: 10 });

  const { data: items = [] } = useApiList("/api/v1/items");
  const { data: users = [] } = useApiList("/api/v1/users", undefined, {
    enabled: canManageUsers,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [reportForm, setReportForm] = useState(createReportForm);
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formFeedback, setFormFeedback] = useState(null);
  const [filters, setFilters] = useState({ keyword: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // DELETE POPUP
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // LOOKUP MAPS
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

  const showInitialLoader = loading && lostReports.length === 0;

  // -----------------------------------------------------
  //   OPEN CREATE DIALOG
  // -----------------------------------------------------
  const openCreateDialog = () => {
    console.debug("[DEBUG] Opening CREATE dialog...");
    setDialogMode("create");
    setEditingReport(null);
    setReportForm(createReportForm());
    setDialogOpen(true);
  };

  // -----------------------------------------------------
  //   OPEN EDIT DIALOG
  // -----------------------------------------------------
  const openEditDialog = (report) => {
    console.debug("[DEBUG] Opening EDIT dialog for report:", report);

    if (!canManageUsers) return;

    setDialogMode("edit");
    setEditingReport(report);

    const item = itemLookup.get(report.itemId);
    console.debug("[DEBUG] Loaded ITEM for editing:", item);

    setReportForm({
      item: item
        ? {
            name: item.name || "",
            category: item.category || "",
            brand: item.brand || "",
            color: item.color || "",
            description: item.description || "",
            serialNumber: item.serialNumber || "",
            identifierMarkings: item.identifierMarkings || "",
            // Convert stored bytes → Data URL for preview
            imageData: convertBytesToDataURL(item.imageData),
          }
        : createItemState(),
      locationLost: report.locationLost || "",
      dateLost: report.dateLost || "",
      extraDescription: report.extraDescription || "",
    });

    setDialogOpen(true);
  };

  const closeDialog = () => {
    console.debug("[DEBUG] Closing dialog.");
    setDialogOpen(false);
    setEditingReport(null);
    setReportForm(createReportForm());
    setFormFeedback(null);
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

  // -----------------------------------------------------
  //     DELETE CONFIRMED
  // -----------------------------------------------------
  const handleDeleteConfirmed = async () => {
    console.debug("[DEBUG] Deleting report:", reportToDelete);

    if (!reportToDelete) return;

    try {
      await apiRequest(`/api/v1/lost-reports/${reportToDelete.id}`, {
        method: "DELETE",
      });

      setFeedback({
        type: "success",
        message: "Lost report deleted.",
      });

      refetch();
    } catch (err) {
      console.error("[DEBUG] DELETE ERROR:", err);

      setFeedback({
        type: "error",
        message: err.message || "Delete failed.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  // -----------------------------------------------------
  //     FIELD CHANGERS
  // -----------------------------------------------------
  const handleItemChange = (field) => (event) => {
    console.debug(`[DEBUG] Item field change: ${field} =`, event.target.value);

    setReportForm((prev) => ({
      ...prev,
      item: { ...prev.item, [field]: event.target.value },
    }));
  };

  const handleFieldChange = (field) => (event) => {
    console.debug(
      `[DEBUG] Report field change: ${field} =`,
      event.target.value
    );

    setReportForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // -----------------------------------------------------
  //    IMAGE UPLOAD → Data URL
  // -----------------------------------------------------
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    console.debug("[DEBUG] File selected:", file);

    if (!file) {
      console.debug("[DEBUG] No file selected -> clearing image.");
      setReportForm((prev) => ({
        ...prev,
        item: { ...prev.item, imageData: "" },
      }));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormFeedback({
        type: "error",
        message: "Image size should be less than 2MB",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFormFeedback({
        type: "error",
        message: "Please select an image file",
      });
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      console.debug(
        "[DEBUG] Data URL image generated:",
        reader.result.substring(0, 80) + "..."
      );
      setReportForm((prev) => ({
        ...prev,
        item: { ...prev.item, imageData: reader.result },
      }));
      setFormFeedback(null); // Clear any previous errors
    };

    reader.readAsDataURL(file);
  };

  // -----------------------------------------------------
  //      SUBMIT CREATE/UPDATE
  // -----------------------------------------------------
  const handleSubmit = async () => {
    console.debug("[DEBUG] Submitting form...", reportForm);

    try {
      setSaving(true);
      setFormFeedback(null);

      // Validate required fields
      if (!reportForm.item.name.trim()) {
        setFormFeedback({
          type: "error",
          message: "Item name is required",
        });
        return;
      }

      if (!reportForm.item.category.trim()) {
        setFormFeedback({
          type: "error",
          message: "Item category is required",
        });
        return;
      }

      if (!reportForm.locationLost.trim()) {
        setFormFeedback({
          type: "error",
          message: "Location lost is required",
        });
        return;
      }

      if (!reportForm.dateLost) {
        setFormFeedback({
          type: "error",
          message: "Date lost is required",
        });
        return;
      }

      // 1) Prepare item payload
      const itemPayload = buildItemPayload(reportForm.item);

      console.debug("[DEBUG] Item payload being SENT:", {
        ...itemPayload,
        imageData: itemPayload.imageData
          ? `[Data URL: ${itemPayload.imageData?.length || 0} chars]`
          : null,
      });

      let itemId;

      if (dialogMode === "create") {
        const item = await apiRequest("/api/v1/items", {
          method: "POST",
          body: itemPayload,
        });

        console.debug("[DEBUG] ITEM CREATED:", item);
        itemId = item.id;
      } else {
        itemId = editingReport.itemId;

        const updateResp = await apiRequest(`/api/v1/items/${itemId}`, {
          method: "PUT",
          body: itemPayload,
        });

        console.debug("[DEBUG] ITEM UPDATED:", updateResp);
      }

      // 2) Create/update lost report
      const reportPayload = {
        userId:
          dialogMode === "create"
            ? Number(currentUserId)
            : editingReport.userId,
        itemId,
        locationLost: reportForm.locationLost,
        dateLost: reportForm.dateLost,
        extraDescription: reportForm.extraDescription || null,
      };

      console.debug("[DEBUG] Lost report payload:", reportPayload);

      const url =
        dialogMode === "edit"
          ? `/api/v1/lost-reports/${editingReport.id}`
          : `/api/v1/lost-reports`;

      const method = dialogMode === "edit" ? "PUT" : "POST";

      const reportResp = await apiRequest(url, {
        method,
        body: reportPayload,
      });

      console.debug("[DEBUG] LOST REPORT RESPONSE:", reportResp);

      setFeedback({
        type: "success",
        message:
          dialogMode === "edit"
            ? "Report updated successfully."
            : "Report created successfully.",
      });

      closeDialog();
      refetch();
    } catch (err) {
      console.error("[DEBUG] Submit ERROR:", err);
      console.error("[DEBUG] Error details:", err.response || err);

      setFormFeedback({
        type: "error",
        message: err.message || "Submit failed. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------
  //          FORM UI
  // -----------------------------------------------------
  const renderForm = () => (
    <Stack spacing={2}>
      {formFeedback && (
        <Alert
          severity={formFeedback.type}
          onClose={() => setFormFeedback(null)}
        >
          {formFeedback.message}
        </Alert>
      )}

      <Typography variant="subtitle2" fontWeight="medium">
        Item Details
      </Typography>

      <TextField
        label="Name *"
        value={reportForm.item.name}
        onChange={handleItemChange("name")}
        fullWidth
        required
        size="small"
      />

      <TextField
        label="Category *"
        value={reportForm.item.category}
        onChange={handleItemChange("category")}
        fullWidth
        required
        size="small"
      />

      <TextField
        label="Brand"
        value={reportForm.item.brand}
        onChange={handleItemChange("brand")}
        fullWidth
        size="small"
      />

      <TextField
        label="Color"
        value={reportForm.item.color}
        onChange={handleItemChange("color")}
        fullWidth
        size="small"
      />

      <TextField
        label="Description"
        value={reportForm.item.description}
        onChange={handleItemChange("description")}
        fullWidth
        multiline
        rows={2}
        size="small"
      />

      <TextField
        label="Serial Number"
        value={reportForm.item.serialNumber}
        onChange={handleItemChange("serialNumber")}
        fullWidth
        size="small"
      />

      <TextField
        label="Identifier Markings"
        value={reportForm.item.identifierMarkings}
        onChange={handleItemChange("identifierMarkings")}
        fullWidth
        size="small"
      />

      <Box>
        <Button variant="outlined" component="label" fullWidth size="small">
          {reportForm.item.imageData ? "Change Photo" : "Upload Photo"}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageChange}
          />
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block" }}
        >
          Supported: JPG, PNG, GIF (Max 2MB)
        </Typography>
      </Box>

      {reportForm.item.imageData && (
        <Box sx={{ textAlign: "center", mt: 1 }}>
          <img
            src={reportForm.item.imageData}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "150px",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Image preview
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle2" fontWeight="medium" sx={{ mt: 1 }}>
        Lost Report Details
      </Typography>

      <TextField
        label="Location Lost *"
        value={reportForm.locationLost}
        onChange={handleFieldChange("locationLost")}
        fullWidth
        required
        size="small"
      />

      <TextField
        type="date"
        label="Date Lost *"
        value={reportForm.dateLost}
        onChange={handleFieldChange("dateLost")}
        InputLabelProps={{ shrink: true }}
        fullWidth
        required
        size="small"
      />

      <TextField
        label="Extra Description"
        value={reportForm.extraDescription}
        onChange={handleFieldChange("extraDescription")}
        fullWidth
        multiline
        rows={2}
        size="small"
        placeholder="Any additional details about how the item was lost..."
      />
    </Stack>
  );

  // -----------------------------------------------------
  //          RETURN UI
  // -----------------------------------------------------
  return (
    <Box>
      <PageHeader
        title="Lost Reports"
        subtitle="Report and track lost items."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreateDialog}
            size="medium"
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

      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell>Item</TableCell>
              {canManageUsers && <TableCell>Reporter</TableCell>}
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
                    <strong>{report.referenceCode || `L-${report.id}`}</strong>
                  </TableCell>

                  <TableCell>
                    {item ? (
                      <>
                        <strong>{item.name}</strong>
                        <br />
                        <span style={{ fontSize: "0.875rem", color: "#666" }}>
                          {item.category}
                          {item.brand && ` • ${item.brand}`}
                          {item.color && ` • ${item.color}`}
                        </span>
                      </>
                    ) : (
                      "Unknown Item"
                    )}
                  </TableCell>

                  {canManageUsers && (
                    <TableCell>{user ? user.fullName : "Unknown"}</TableCell>
                  )}

                  <TableCell>{formatDate(report.dateLost)}</TableCell>
                  <TableCell>{report.locationLost}</TableCell>

                  <TableCell>
                    <StatusChip value={report.status} />
                  </TableCell>

                  <TableCell>{formatDateTime(report.updatedAt)}</TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(report)}
                        disabled={!canManageUsers}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          console.debug("[DEBUG] Delete clicked:", report);
                          setReportToDelete(report);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!canManageUsers}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}

            {!loading && lostReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No lost reports available.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {showInitialLoader && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}
        <TablePagination
          component="div"
          count={pageData?.totalElements ?? lostReports.length}
          page={pageData?.number ?? page}
          onPageChange={handlePageChange}
          rowsPerPage={pageData?.size ?? rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* CREATE / EDIT POPUP */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}>
          {dialogMode === "edit" ? "Edit Lost Report" : "Create Lost Report"}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            Fields marked with * are required
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {renderForm()}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ minWidth: 100 }}
          >
            {saving ? (
              <CircularProgress size={24} />
            ) : dialogMode === "edit" ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE POPUP */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Lost Report</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete Lost Report #{reportToDelete?.id}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirmed}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
