// Updated claims page
import React, { useMemo, useState, useEffect } from "react";
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
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

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

  // Handle null/undefined
  if (!byteArray) {
    console.debug("[DEBUG] No image data");
    return "";
  }

  // If it's already a string (might be base64 from frontend form)
  if (typeof byteArray === "string") {
    if (byteArray.startsWith("data:")) {
      console.debug("[DEBUG] Already a data URL");
      return byteArray;
    }
    // If it's base64 without prefix, add it
    if (byteArray.length > 0) {
      console.debug("[DEBUG] Base64 string detected, adding data URL prefix");
      return `data:image/png;base64,${byteArray}`;
    }
    return "";
  }

  // If it's a JSON array (byte array from backend)
  if (Array.isArray(byteArray)) {
    console.debug(
      "[DEBUG] Converting byte array to data URL, length:",
      byteArray.length
    );

    if (byteArray.length === 0) {
      console.debug("[DEBUG] Empty byte array");
      return "";
    }

    try {
      // Convert JSON array to Uint8Array
      const uint8Array = new Uint8Array(byteArray);

      // Convert to binary string
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      // Convert to base64
      const base64 = btoa(binary);
      const result = `data:image/png;base64,${base64}`;

      console.debug(
        "[DEBUG] convertBytesToDataURL OUTPUT:",
        result.substring(0, 50) + "..."
      );

      return result;
    } catch (error) {
      console.error("[DEBUG] Error converting byte array:", error);
      return "";
    }
  }

  // If it's an ArrayBuffer or other binary format
  if (
    byteArray instanceof ArrayBuffer ||
    byteArray.buffer instanceof ArrayBuffer
  ) {
    console.debug("[DEBUG] ArrayBuffer detected");
    try {
      const view = new Uint8Array(byteArray);
      const binary = String.fromCharCode.apply(null, view);
      const base64 = btoa(binary);
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("[DEBUG] Error converting ArrayBuffer:", error);
      return "";
    }
  }

  console.debug(
    "[DEBUG] Unknown image data format:",
    typeof byteArray,
    byteArray
  );
  return "";
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

  // Handle image data - ensure it's a data URL for backend
  if (itemState.imageData) {
    // If it's already a data URL, use it
    if (
      typeof itemState.imageData === "string" &&
      itemState.imageData.startsWith("data:")
    ) {
      payload.imageData = itemState.imageData;
    }
    // If it's base64 without prefix (from editing), add prefix
    else if (
      typeof itemState.imageData === "string" &&
      itemState.imageData.length > 0
    ) {
      payload.imageData = `data:image/png;base64,${itemState.imageData}`;
    }
    // If it's a byte array (shouldn't happen from frontend form), convert to data URL
    else if (Array.isArray(itemState.imageData)) {
      const dataUrl = convertBytesToDataURL(itemState.imageData);
      if (dataUrl) {
        payload.imageData = dataUrl;
      }
    }

    console.debug(
      "[DEBUG] Image payload prepared:",
      payload.imageData ? payload.imageData.substring(0, 100) + "..." : "null"
    );
  } else {
    payload.imageData = null;
  }

  return payload;
};

// -----------------------------------------------------
//       LEGACY COMPONENT (kept for reference)
// -----------------------------------------------------
function LegacyClaims({ currentUserId, permissions = [] }) {
  const canManageUsers =
    Array.isArray(permissions) && permissions.includes("MANAGE_USERS");

  const {
    data: lostReports = [],
    loading,
    refetch,
  } = useApiList("/api/v1/lost-reports");

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

  // Debug: Log what we're receiving from API
  useEffect(() => {
    if (items.length > 0) {
      console.log("[DEBUG] Items from API:", items);
      const itemWithImage = items.find((item) => item.imageData);
      if (itemWithImage) {
        console.log("[DEBUG] Sample item with image:", {
          id: itemWithImage.id,
          name: itemWithImage.name,
          imageDataType: typeof itemWithImage.imageData,
          isArray: Array.isArray(itemWithImage.imageData),
          imageDataLength: itemWithImage.imageData?.length,
          imageDataPreview: Array.isArray(itemWithImage.imageData)
            ? itemWithImage.imageData.slice(0, 10)
            : itemWithImage.imageData?.substring(0, 50),
        });
      }
    }
  }, [items]);

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

    // Convert byte array to data URL for form
    const imageData = item ? convertBytesToDataURL(item.imageData) : "";

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
            imageData: imageData,
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
      console.error("[DEBUG] Error details:", err);

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

// -----------------------------------------------------
//       NEW CLAIMS UI
// -----------------------------------------------------
export default function Claims({ currentUserId, permissions = [] }) {
  const canReview =
    Array.isArray(permissions) && permissions.includes("VERIFY_CLAIM");

  const { data: claims = [], loading, error, setParams, page: pageData } = useApiList(
    "/api/v1/claims",
    { page: 0, size: 10, userId: canReview ? undefined : currentUserId },
  );
  const { data: foundReports = [] } = useApiList("/api/v1/found-reports", {
    page: 0,
    size: 100,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    foundReportId: "",
    reason: "",
    verificationAnswer: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [formFeedback, setFormFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  React.useEffect(() => {
    if (!canReview && currentUserId) {
      setParams((prev) => ({ ...prev, page, size: rowsPerPage, userId: currentUserId }));
    }
  }, [canReview, currentUserId, page, rowsPerPage, setParams]);

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const foundLookup = useMemo(() => {
    const map = new Map();
    foundReports.forEach((r) => map.set(r.id, r));
    return map;
  }, [foundReports]);

  const claimantLabel = (claim) =>
    claim.user?.fullName || claim.user?.email || `User #${claim.userId || "?"}`;

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setAttachments([]);
      return;
    }
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve({ name: file.name, dataUrl: reader.result });
            reader.readAsDataURL(file);
          }),
      ),
    ).then(setAttachments);
  };

  const openForm = () => {
    setFormFeedback(null);
    setFormState({ foundReportId: "", reason: "", verificationAnswer: "" });
    setAttachments([]);
    setFormOpen(true);
  };

  const submitClaim = async (event) => {
    event.preventDefault();
    if (!currentUserId) {
      setFormFeedback({
        type: "error",
        message: "You must be signed in to submit a claim.",
      });
      return;
    }
    setSubmitting(true);
    setFormFeedback(null);
    try {
      await apiRequest("/api/v1/claims", {
        method: "POST",
        body: {
          userId: currentUserId,
          foundReportId: Number(formState.foundReportId),
          reason: formState.reason,
          verificationAnswer: formState.verificationAnswer,
          attachments: attachments.map((a) => a.dataUrl),
        },
      });
      setFormOpen(false);
      setParams((prev) => ({ ...prev }));
    } catch (err) {
      setFormFeedback({
        type: "error",
        message: err.message || "Unable to submit claim.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReview = (claim) => {
    setReviewFeedback(null);
    setReviewNotes("");
    setReviewDialog(claim);
  };

  const reviewClaim = async (status) => {
    if (!reviewDialog || !currentUserId) return;
    setReviewing(true);
    setReviewFeedback(null);
    try {
      await apiRequest(`/api/v1/claims/${reviewDialog.id}/status`, {
        method: "PATCH",
        params: {
          status,
          reviewerId: currentUserId,
          reviewNotes: reviewNotes || undefined,
        },
      });
      setReviewDialog(null);
      setParams((prev) => ({ ...prev }));
    } catch (err) {
      setReviewFeedback({
        type: "error",
        message: err.message || "Unable to update claim.",
      });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Claims"
        subtitle="Submit a claim for a found item or review pending claims."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openForm}
          >
            New Claim
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Claim</TableCell>
              <TableCell>Found Ref</TableCell>
              <TableCell>Claimant</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              {canReview && <TableCell align="right">Review</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={canReview ? 7 : 6} align="center">
                  Loading claims...
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              claims.map((claim) => {
                const found = foundLookup.get(claim.foundReportId);
                return (
                  <TableRow key={claim.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>#{claim.id}</Typography>
                    </TableCell>
                    <TableCell>
                      {found ? (
                        <>
                          <strong>{found.referenceCode || `F-${found.id}`}</strong>
                          <br />
                          <Typography variant="body2" color="text.secondary">
                            {found.locationFound}
                          </Typography>
                        </>
                      ) : (
                        `Found #${claim.foundReportId}`
                      )}
                    </TableCell>
                    <TableCell>{claimantLabel(claim)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{claim.reason}</Typography>
                      {claim.verificationAnswer && (
                        <Typography variant="body2" color="text.secondary">
                          Answer: {claim.verificationAnswer}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip value={claim.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(claim.updatedAt)}</TableCell>
                    {canReview && (
                      <TableCell align="right">
                        {claim.status === "PENDING" ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<CheckRoundedIcon />}
                              onClick={() => openReview(claim)}
                            >
                              Review
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Reviewed
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            {!loading && claims.length === 0 && (
              <TableRow>
                <TableCell colSpan={canReview ? 7 : 6} align="center">
                  No claims available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pageData?.totalElements ?? claims.length}
          page={pageData?.number ?? page}
          onPageChange={handlePageChange}
          rowsPerPage={pageData?.size ?? rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit Claim</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" spacing={2}>
            <TextField
              select
              label="Found Report"
              value={formState.foundReportId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  foundReportId: event.target.value,
                }))
              }
              fullWidth
              required
            >
              {foundReports.map((report) => (
                <MenuItem key={report.id} value={report.id}>
                  {report.referenceCode || `F-${report.id}`} — {report.locationFound}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Reason"
              value={formState.reason}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, reason: event.target.value }))
              }
              multiline
              minRows={2}
              fullWidth
              required
            />

            <TextField
              label="Verification Answer"
              value={formState.verificationAnswer}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  verificationAnswer: event.target.value,
                }))
              }
              multiline
              minRows={2}
              fullWidth
            />

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Attach proof (images/PDF). Optional.
              </Typography>
              <Button variant="outlined" component="label">
                Choose files
                <input type="file" hidden multiple onChange={handleFileChange} />
              </Button>
              {attachments.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {attachments.length} file{attachments.length === 1 ? "" : "s"} attached
                </Typography>
              )}
            </Stack>

            {formFeedback && (
              <Alert severity={formFeedback.type}>{formFeedback.message}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submitClaim} variant="contained" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Claim"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(reviewDialog)} onClose={() => setReviewDialog(null)} fullWidth>
        <DialogTitle>Review Claim #{reviewDialog?.id}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Reason"
              value={reviewDialog?.reason || ""}
              InputProps={{ readOnly: true }}
              placeholder="No reason provided"
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Answer"
              value={reviewDialog?.verificationAnswer || ""}
              InputProps={{ readOnly: true }}
              placeholder="No answer provided"
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Review notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            {reviewFeedback && (
              <Alert severity={reviewFeedback.type}>{reviewFeedback.message}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(null)} startIcon={<CloseRoundedIcon />}>
            Close
          </Button>
          <Button
            onClick={() => reviewClaim("REJECTED")}
            color="error"
            disabled={reviewing}
            startIcon={<CloseRoundedIcon />}
          >
            Reject
          </Button>
          <Button
            onClick={() => reviewClaim("APPROVED")}
            color="success"
            variant="contained"
            disabled={reviewing}
            startIcon={<CheckRoundedIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
