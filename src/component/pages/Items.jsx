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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../common/PageHeader";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";
import { formatDateTime } from "../../lib/formatters";

const emptyItem = {
  name: "",
  category: "",
  description: "",
  brand: "",
  color: "",
  serialNumber: "",
  identifierMarkings: "",
};

export default function Items() {
  const {
    data: items,
    loading,
    error,
    refetch,
    setParams,
    params,
  } = useApiList("/api/v1/items");
  const [filters, setFilters] = useState({ name: "", category: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(emptyItem);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const hasFilters = useMemo(
    () => Boolean(params?.name || params?.category),
    [params],
  );

  const openDialog = (item) => {
    setEditingItem(item ?? null);
    setFormState(item ?? emptyItem);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormState(emptyItem);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setParams({
      name: filters.name.trim() || undefined,
      category: filters.category.trim() || undefined,
    });
  };

  const handleResetFilters = () => {
    setFilters({ name: "", category: "" });
    setParams({});
  };

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload = { ...formState };
      const path = editingItem ? `/api/v1/items/${editingItem.id}` : "/api/v1/items";
      const method = editingItem ? "PUT" : "POST";
      await apiRequest(path, { method, body: payload });
      setFeedback({
        type: "success",
        message: `Item ${editingItem ? "updated" : "created"} successfully.`,
      });
      closeDialog();
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Unable to submit." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
      "Delete this item definition? Reports referencing it will be unaffected.",
    );
    if (!confirmed) return;
    try {
      await apiRequest(`/api/v1/items/${itemId}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Item deleted." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete." });
    }
  };

  const showInitialLoader = loading && items.length === 0;

  return (
    <Box>
      <PageHeader
        title="Item Catalog"
        subtitle="Define the items that can be referenced by lost or found reports."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => openDialog()}
          >
            New Item
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
            label="Search by name"
            value={filters.name}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Category"
            value={filters.category}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, category: event.target.value }))
            }
            fullWidth
          />
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="outlined">
              Apply
            </Button>
            {hasFilters && (
              <Button type="button" onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Serial</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.color || "—"}</TableCell>
                <TableCell>{item.brand || "—"}</TableCell>
                <TableCell>{item.serialNumber || "—"}</TableCell>
                <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit item">
                    <IconButton onClick={() => openDialog(item)} size="small">
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete item">
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      size="small"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!showInitialLoader && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No items found.
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
        <DialogTitle>{editingItem ? "Edit Item" : "New Item"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formState.name}
              onChange={(event) => handleChange("name", event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Category"
              value={formState.category}
              onChange={(event) => handleChange("category", event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formState.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              fullWidth
              multiline
              rows={3}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Brand"
                value={formState.brand}
                onChange={(event) => handleChange("brand", event.target.value)}
                fullWidth
              />
              <TextField
                label="Color"
                value={formState.color}
                onChange={(event) => handleChange("color", event.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Serial number"
                value={formState.serialNumber}
                onChange={(event) =>
                  handleChange("serialNumber", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Identifier markings"
                value={formState.identifierMarkings}
                onChange={(event) =>
                  handleChange("identifierMarkings", event.target.value)
                }
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
