import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box, Divider } from '@mui/material';
import { Logout, Person } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_LABEL = {
    admin: 'Admin',
    faculty: 'Faculty',
    student: 'Student',
};

const Navbar = ({ title = 'Attendance System' }) => {
    const { user, logoutAll } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logoutAll();
        navigate('/login');
        handleClose();
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                backgroundColor: 'white',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {user.username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                                {user.role}
                            </Typography>
                        </Box>
                        <IconButton
                            size="large"
                            onClick={handleMenu}
                            sx={{
                                p: 0.5,
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'primary.main',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                }}
                            >
                                {user.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    minWidth: 200,
                                }
                            }}
                        >
                            <MenuItem onClick={handleClose} sx={{ gap: 1.5 }}>
                                <Person fontSize="small" />
                                Profile
                            </MenuItem>

                            <Divider />

                            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: 'error.main' }}>
                                <Logout fontSize="small" />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
