import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle,
    DateRange,
    TrendingUp,
    Schedule,
} from '@mui/icons-material';
import Navbar from '../components/layout/Navbar';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';

const StudentDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClasses: 0,
        present: 0,
        attendancePercentage: 0,
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/attendance/my-logs');
            const data = response.data;
            setLogs(data);

            const total = data.length;
            const present = data.filter(log => log.status === 'Present').length;
            const percentage = total > 0 ? (present / total) * 100 : 0;

            setStats({
                totalClasses: total,
                present: present,
                attendancePercentage: percentage
            });
        } catch (error) {
            console.error('Failed to fetch attendance logs', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader fullScreen />;

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Navbar title="Student Dashboard" />

            <PageHeader
                title="My Attendance"
                subtitle="Track your attendance records and statistics"
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {stats.attendancePercentage.toFixed(1)}%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Overall Attendance
                                        </Typography>
                                    </Box>
                                    <TrendingUp sx={{ fontSize: 40, color: 'primary.light', opacity: 0.5 }} />
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={stats.attendancePercentage}
                                    sx={{ mt: 2, height: 6, borderRadius: 3 }}
                                    color={stats.attendancePercentage >= 75 ? 'success' : 'warning'}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                            {stats.present}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Classes Attended
                                        </Typography>
                                    </Box>
                                    <CheckCircle sx={{ fontSize: 40, color: 'success.light', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                            {stats.totalClasses}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Classes
                                        </Typography>
                                    </Box>
                                    <DateRange sx={{ fontSize: 40, color: 'info.light', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Attendance Table */}
                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Recent Activity
                        </Typography>
                    </Box>

                    {logs.length === 0 ? (
                        <EmptyState
                            title="No records found"
                            description="You haven't been marked present in any classes yet."
                        />
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date & Time</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Session</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Schedule fontSize="small" color="action" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.status}
                                                    color={log.status === 'Present' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {log.session_id ? log.session_id.split('T')[0] : 'N/A'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default StudentDashboard;
