import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import { apiRequest } from "../../lib/api";
import { USER_ROLES } from "../../lib/constants";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  registrationNumber: "",
  department: "",
  role: "",
};

export default function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (!form.fullName || !form.email || !form.password) {
        throw new Error("Full name, email, and password are required.");
      }
      const payload = {
        ...form,
        role: form.role || undefined,
        phoneNumber: form.phoneNumber || undefined,
        registrationNumber: form.registrationNumber || undefined,
        department: form.department || undefined,
      };
      const response = await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: payload,
      });
      setFeedback({
        type: "success",
        message: "Account created successfully.",
      });
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin();
        }
      }, 1200);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Registration failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderRoleValue = (selected) => {
    if (!selected) {
      return (
        <Typography component="span" color="text.secondary">
          Select role (optional)
        </Typography>
      );
    }
    return (
      USER_ROLES.find((role) => role.value === selected)?.label || selected
    );
  };

  return (
    <Box sx={{ maxWidth: 640, width: "100%", color: "#fff" }}>
      <Typography variant="h3" fontWeight={800} gutterBottom color="#fff">
        Create Account
      </Typography>
      <Typography sx={{ mb: 3, color: "rgba(255,255,255,0.8)" }}>
        Provide the details below to register a new user in the Lost &amp; Found
        system.
      </Typography>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: "1px solid rgba(15, 157, 88, 0.4)",
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      >
        <Stack spacing={3}>
          {feedback && (
            <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          )}
          <TextField
            label="Full name"
            value={form.fullName}
            onChange={handleChange("fullName")}
            required
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            fullWidth
            helperText="Must be at least 8 characters."
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone number"
                value={form.phoneNumber}
                onChange={handleChange("phoneNumber")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                value={form.role}
                onChange={handleChange("role")}
                fullWidth
                SelectProps={{
                  displayEmpty: true,
                  renderValue: renderRoleValue,
                }}
              >
                <MenuItem value="">
                  <Typography color="text.secondary">
                    Select role (optional)
                  </Typography>
                </MenuItem>
                {USER_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration number"
                value={form.registrationNumber}
                onChange={handleChange("registrationNumber")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<PersonAddAlt1RoundedIcon />}
            disabled={submitting}
            sx={{
              backgroundColor: "#0f9d58",
              "&:hover": { backgroundColor: "#0c8b47" },
              py: 1.2,
              fontWeight: 600,
            }}
          >
            {submitting ? "Submitting..." : "Register"}
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<LoginRoundedIcon />}
            onClick={onSwitchToLogin}
            sx={{
              borderColor: "#0f9d58",
              color: "#0f9d58",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#0c8b47",
                backgroundColor: "rgba(15,157,88,0.08)",
              },
            }}
          >
            Already have an account? Login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
