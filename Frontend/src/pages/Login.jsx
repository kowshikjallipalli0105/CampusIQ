import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    Paper,
    InputAdornment,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Login as LoginIcon,
    FingerprintOutlined,
} from '@mui/icons-material';
import ChangePassword from '../components/ChangePassword';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [firstLogin, setFirstLogin] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [forgotPassword, setForgotPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                const role = result.role;
                const firstLoginFlag = Boolean(result.first_login);

                if (firstLoginFlag) {
                    setFirstLogin(true);
                    setShowPasswordChange(true);
                } else {
                    navigateByRole(role);
                }
            } else {
                setError('Invalid username or password');
                // Trigger shake animation
                const form = document.getElementById('login-form');
                form?.classList.add('animate-shake');
                setTimeout(() => form?.classList.remove('animate-shake'), 500);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const navigateByRole = (role) => {
        if (role === 'admin') navigate('/admin');
        else if (role === 'faculty') navigate('/faculty');
        else if (role === 'student') navigate('/student');
        else navigate('/');
    };

    const handlePasswordChangeSuccess = () => {
        setShowPasswordChange(false);
        alert('Password changed successfully! Please login again with your new password.');
        logout();
        setUsername('');
        setPassword('');
        setFirstLogin(false);
    };

    const openForgotPasswordDialog = () => {
        setForgotUsername((username || '').trim());
        setForgotPassword('');
        setForgotConfirmPassword('');
        setForgotError('');
        setForgotSuccess('');
        setForgotOpen(true);
    };

    const closeForgotPasswordDialog = () => {
        if (forgotLoading) return;
        setForgotOpen(false);
    };

    const handleForgotPasswordSubmit = async () => {
        const normalizedUsername = (forgotUsername || '').trim();

        if (!normalizedUsername) {
            setForgotError('Username is required');
            return;
        }
        if (forgotPassword.length < 6) {
            setForgotError('Password must be at least 6 characters long');
            return;
        }
        if (forgotPassword !== forgotConfirmPassword) {
            setForgotError('Passwords do not match');
            return;
        }

        setForgotLoading(true);
        setForgotError('');
        setForgotSuccess('');

        try {
            const response = await api.post('/auth/forgot-password', {
                username: normalizedUsername,
                new_password: forgotPassword,
            });
            setForgotSuccess(response.data?.message || 'Password reset successfully. Please login with your new password.');
            setPassword('');
        } catch (err) {
            setForgotError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setForgotLoading(false);
        }
    };


    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated Background Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '40%',
                    height: '40%',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    filter: 'blur(60px)',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-5%',
                    width: '35%',
                    height: '35%',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Left Side - Branding */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    px: 6,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <FingerprintOutlined sx={{ fontSize: 80, mb: 3, opacity: 0.9 }} />
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}>
                    Attendance System
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 500 }}>
                    Secure face recognition-based attendance tracking for modern institutions
                </Typography>
            </Box>

            {/* Right Side - Login Form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Paper
                    elevation={24}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        width: '100%',
                        maxWidth: 450,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to continue to your account
                        </Typography>
                    </Box>


                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        id="login-form"
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                    >
                        <TextField
                            label="Username"
                            variant="outlined"
                            fullWidth
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'background.paper',
                                },
                            }}
                        />

                        <TextField
                            label="Password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'background.paper',
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                            sx={{
                                py: 1.5,
                                mt: 1,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4291 100%)',
                                },
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={openForgotPasswordDialog} disabled={loading}>
                                Forgot Password?
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            © 2024 Attendance System. All rights reserved.
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            <Dialog open={forgotOpen} onClose={closeForgotPasswordDialog} maxWidth="xs" fullWidth>
                <DialogTitle>Forgot Password</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {forgotError && <Alert severity="error">{forgotError}</Alert>}
                        {forgotSuccess && <Alert severity="success">{forgotSuccess}</Alert>}

                        <TextField
                            label="Username"
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            disabled={forgotLoading}
                            fullWidth
                        />
                        <TextField
                            label="New Password"
                            type="password"
                            value={forgotPassword}
                            onChange={(e) => setForgotPassword(e.target.value)}
                            disabled={forgotLoading}
                            fullWidth
                        />
                        <TextField
                            label="Confirm New Password"
                            type="password"
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            disabled={forgotLoading}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeForgotPasswordDialog} disabled={forgotLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleForgotPasswordSubmit} disabled={forgotLoading}>
                        {forgotLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ChangePassword
                open={showPasswordChange}
                onClose={() => { }}
                onSuccess={handlePasswordChangeSuccess}
            />
        </Box>
    );
};

export default Login;
