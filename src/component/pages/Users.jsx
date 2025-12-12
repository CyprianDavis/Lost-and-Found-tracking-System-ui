import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
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
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PageHeader from "../common/PageHeader";
import { USER_ROLES } from "../../lib/constants";
import { formatDateTime } from "../../lib/formatters";
import { useApiList } from "../../hooks/useApiList";
import { apiRequest } from "../../lib/api";

const emptyUser = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  role: "",
  registrationNumber: "",
  department: "",
  active: true,
};

export default function Users() {
  const {
    data: users = [],
    loading,
    error,
    refetch,
    setParams,
  } = useApiList("/api/v1/users");

  const [filters, setFilters] = useState({ role: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // NEW — confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const showInitialLoader = loading && users.length === 0;

  const openDialog = (user) => {
    setEditingUser(user ?? null);
    setFormState(
      user
        ? {
            fullName: user.fullName || "",
            username: user.username || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            role: user.role || "",
            registrationNumber: user.registrationNumber || "",
            department: user.department || "",
            active: user.active ?? true,
          }
        : emptyUser
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormState(emptyUser);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setParams({ role: filters.role || undefined });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload = { ...formState };
      if (!editingUser) {
        const baseUsername = (formState.username || "").trim();
        if (!baseUsername) {
          throw new Error("Username is required to create a user.");
        }
        payload.password = `${baseUsername}123`;
      }
      const path = editingUser
        ? `/api/v1/users/${editingUser.id}`
        : "/api/v1/users";
      const method = editingUser ? "PUT" : "POST";
      await apiRequest(path, { method, body: payload });
      setFeedback({
        type: "success",
        message: `User ${editingUser ? "updated" : "created"}.`,
      });
      closeDialog();
      refetch();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Submission failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Open confirmation dialog instead of window.confirm
  const openDeactivateDialog = (userId) => {
    setSelectedUserId(userId);
    setConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedUserId(null);
  };

  const handleDeactivateConfirm = async () => {
    try {
      await apiRequest(`/api/v1/users/${selectedUserId}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "User deactivated." });
      refetch();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Action failed." });
    }
    closeConfirmDialog();
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage community members that can submit reports and claims."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => openDialog()}
          >
            New User
          </Button>
        }
      />

      {/* Alerts */}
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

      {/* Filters */}
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
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
        >
          <TextField
            select
            label="Role"
            value={filters.role}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, role: event.target.value }))
            }
            fullWidth
          >
            <MenuItem value="">All roles</MenuItem>
            {USER_ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="outlined">
            Apply filters
          </Button>
        </Stack>
      </Paper>

      {/* TABLE */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{user.fullName}</Typography>
                    {user.registrationNumber && (
                      <Typography variant="body2" color="text.secondary">
                        {user.registrationNumber}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">{user.email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.phoneNumber || "No phone"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={user.active ? "Active" : "Inactive"}
                    color={user.active ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDateTime(user.createdAt)}</TableCell>

                {/* ACTION BUTTONS */}
                <TableCell align="right">
                  <Tooltip title="Edit user">
                    <IconButton size="small" onClick={() => openDialog(user)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Deactivate user">
                    <IconButton
                      size="small"
                      onClick={() => openDeactivateDialog(user.id)}
                    >
                      <PersonOffRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {!showInitialLoader && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users available.
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

      {/* ADD / EDIT USER DIALOG */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingUser ? "Edit User" : "Register User"}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={formState.fullName}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, fullName: e.target.value }))
              }
              required
            />

            <TextField
              label="Username"
              value={formState.username}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              required
            />

            <TextField
              label="Email"
              type="email"
              value={formState.email}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />

            <TextField
              label="Phone number"
              value={formState.phoneNumber}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
            />

            <TextField
              select
              label="Role"
              value={formState.role}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, role: e.target.value }))
              }
              required
            >
              <MenuItem value="">Select role</MenuItem>
              {USER_ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Registration number"
                value={formState.registrationNumber}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    registrationNumber: e.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Department"
                value={formState.department}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formState.active)}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                />
              }
              label="Active"
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

      {/* CONFIRMATION DIALOG FOR DEACTIVATION */}
      <Dialog
        open={confirmDialogOpen}
        onClose={closeConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate User</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to deactivate this user account? They will no
            longer be able to login or perform actions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivateConfirm}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
