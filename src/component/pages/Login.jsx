import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { apiRequest } from "../../lib/api";

const initialForm = {
  email: "",
  password: "",
};

export default function Login({ onSwitchToRegister, onAuthenticated }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (!form.email || !form.password) {
        throw new Error("Email and password are required.");
      }
      const result = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: form,
      });
      setFeedback({ type: "success", message: "Login successful." });
      if (onAuthenticated) {
        onAuthenticated(result);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Unable to login.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 480,
        width: "100%",
        color: "#fff",
      }}
    >
      <Typography variant="h3" fontWeight={800} gutterBottom color="#fff">
        Welcome Back
      </Typography>
      <Typography sx={{ mb: 3, color: "rgba(255,255,255,0.8)" }}>
        Authenticate with your registered email and password.
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
            <Alert
              severity={feedback.type}
              onClose={() => setFeedback(null)}
            >
              {feedback.message}
            </Alert>
          )}

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
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange("password")}
            required
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<LoginRoundedIcon />}
            disabled={submitting}
            sx={{
              backgroundColor: "#0f9d58",
              "&:hover": { backgroundColor: "#0c8b47" },
              py: 1.2,
              fontWeight: 600,
            }}
          >
            {submitting ? "Signing in..." : "Login"}
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<PersonAddAlt1RoundedIcon />}
            onClick={onSwitchToRegister}
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
            Need an account? Sign up
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
