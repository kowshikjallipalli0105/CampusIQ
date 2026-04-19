import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import api from '../api/axios';

const ChangePassword = ({ open, onClose, onSuccess }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = (password) => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z\d]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const getStrengthColor = () => {
        if (passwordStrength < 40) return 'error';
        if (passwordStrength < 70) return 'warning';
        return 'success';
    };

    const getStrengthLabel = () => {
        if (passwordStrength < 40) return 'Weak';
        if (passwordStrength < 70) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async () => {
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.post('/users/change-password', {
                old_password: oldPassword,
                new_password: newPassword,
            });
            onSuccess();
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Lock color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Change Password
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Current Password"
                            type={showOldPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box>
                            <TextField
                                label="New Password"
                                type={showNewPassword ? 'text' : 'password'}
                                fullWidth
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {newPassword && (
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Password Strength
                                        </Typography>
                                        <Typography variant="caption" color={`${getStrengthColor()}.main`} sx={{ fontWeight: 600 }}>
                                            {getStrengthLabel()}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={passwordStrength}
                                        color={getStrengthColor()}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            )}
                        </Box>

                        <TextField
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            error={confirmPassword && newPassword !== confirmPassword}
                            helperText={
                                confirmPassword && newPassword !== confirmPassword
                                    ? 'Passwords do not match'
                                    : ''
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} size="large">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                    size="large"
                    sx={{ px: 3 }}
                >
                    {loading ? 'Changing...' : 'Change Password'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePassword;
