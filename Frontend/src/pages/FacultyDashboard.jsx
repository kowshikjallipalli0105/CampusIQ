import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../api/axios';
import {
    Box,
    Button,
    Typography,
    Container,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Grid,
    Card,
    CardContent,
    IconButton,
    Divider,
    Menu,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Download,
    Timer,
    People,
    CheckCircle,
    Cancel,
    MoreVert,
    CloudUpload,
} from '@mui/icons-material';
import Navbar from '../components/layout/Navbar';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/common/EmptyState';

const FacultyDashboard = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [detectedFaces, setDetectedFaces] = useState([]);
    const [sessionTime, setSessionTime] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [uploadedImageSrc, setUploadedImageSrc] = useState(null); // Added state for image preview
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [isCompletingSession, setIsCompletingSession] = useState(false);

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const uploadedImgRef = useRef(null);
    const intervalRef = useRef(null);
    const timerRef = useRef(null);
    const recognitionInFlightRef = useRef(false);
    const sessionIdRef = useRef(null);
    const sectionIdRef = useRef(selectedSection);

    // Keep refs in sync with state so interval callbacks always read the latest values
    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
    useEffect(() => { sectionIdRef.current = selectedSection; }, [selectedSection]);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const res = await api.get('/sections/');
                setSections(res.data);
                if (res.data.length > 0) {
                    setSelectedSection(res.data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch sections', err);
            }
        };
        fetchSections();
        return () => stopSession();
    }, []);

    useEffect(() => {
        if (isSessionActive && !uploadedImageSrc) {
            timerRef.current = setInterval(() => {
                setSessionTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (!isSessionActive) setSessionTime(0);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isSessionActive, uploadedImageSrc]);

    const startSession = () => {
        const sid = new Date().toISOString();
        setSessionId(sid);
        sessionIdRef.current = sid;
        setIsSessionActive(true);
        setLogs([]);
        setDetectedFaces([]);
        setUploadedImageSrc(null);
        intervalRef.current = setInterval(captureAndSend, 1000);
    };

    const stopSession = async () => {
        setIsSessionActive(false);
        setUploadedImageSrc(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        while (recognitionInFlightRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const currentSessionId = sessionIdRef.current;
        const currentSectionId = sectionIdRef.current;

        if (currentSessionId && currentSectionId) {
            try {
                setIsCompletingSession(true);
                await fetchLogs(currentSessionId);
                const formData = new FormData();
                formData.append('section_id', currentSectionId);
                const response = await api.post(`/attendance/session/${currentSessionId}/complete`, formData);
                setSessionSummary(response.data);
                setSummaryOpen(true);
            } catch (error) {
                console.error('Failed to complete session', error);
            } finally {
                setIsCompletingSession(false);
            }
        }
    };

    const captureAndSend = async () => {
        if (recognitionInFlightRef.current) {
            return;
        }

        const currentSessionId = sessionIdRef.current;
        const currentSectionId = sectionIdRef.current;

        if (webcamRef.current && !uploadedImageSrc) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc && currentSessionId) {
                const blob = await fetch(imageSrc).then((res) => res.blob());
                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');
                formData.append('session_id', currentSessionId);
                formData.append('section_id', currentSectionId);

                try {
                    recognitionInFlightRef.current = true;
                    setIsRecognizing(true);
                    const response = await api.post('/attendance/recognize', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    setDetectedFaces(response.data.faces || []);
                    drawBoundingBoxes(response.data.faces || []);
                    fetchLogs(currentSessionId);
                } catch (error) {
                    console.error('Recognition failed', error);
                } finally {
                    recognitionInFlightRef.current = false;
                    setIsRecognizing(false);
                }
            }
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Preview the image visually
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImageSrc(e.target.result);
        };
        reader.readAsDataURL(file);

        // If session not started, start a dummy one for tracking
        let currentSessionId = sessionId;
        if (!isSessionActive) {
            currentSessionId = new Date().toISOString();
            setSessionId(currentSessionId);
            setIsSessionActive(true);
            setLogs([]);
            setDetectedFaces([]);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', currentSessionId);
        formData.append('section_id', selectedSection || '1'); // Update with selected section

        try {
            recognitionInFlightRef.current = true;
            setIsRecognizing(true);
            const response = await api.post('/attendance/recognize', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const faces = response.data.faces || [];
            setDetectedFaces(faces);

            // Draw dummy bounding boxes based on the known image aspect.
            // Using a slight delay to ensure img bounds have rendered
            setTimeout(() => {
                if (uploadedImgRef.current && canvasRef.current) {
                    drawBoundingBoxes(faces, true);
                }
            }, 100);

            fetchLogs(currentSessionId);
        } catch (error) {
            console.error('Recognition on upload failed', error);
        } finally {
            recognitionInFlightRef.current = false;
            setIsRecognizing(false);
        }
    };

    const drawBoundingBoxes = (faces, isImagePreview = false) => {
        const sourceElement = isImagePreview ? uploadedImgRef.current : webcamRef.current?.video;
        const canvas = canvasRef.current;
        if (!sourceElement || !canvas) return;

        const ctx = canvas.getContext('2d');

        // Match canvas dimensions to the active visible element
        if (isImagePreview) {
            canvas.width = sourceElement.naturalWidth || sourceElement.width;
            canvas.height = sourceElement.naturalHeight || sourceElement.height;
            // Scale context to match the CSS rendered width vs natural width
            const scaleX = sourceElement.clientWidth / canvas.width;
            const scaleY = sourceElement.clientHeight / canvas.height;
            canvas.width = sourceElement.clientWidth;
            canvas.height = sourceElement.clientHeight;
            ctx.scale(scaleX, scaleY);
        } else {
            canvas.width = sourceElement.videoWidth;
            canvas.height = sourceElement.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width / (isImagePreview ? (sourceElement.clientWidth / canvas.width) : 1), canvas.height / (isImagePreview ? (sourceElement.clientHeight / canvas.height) : 1));

        faces.forEach((face) => {
            if (face.bbox) {
                const [x, y, w, h] = face.bbox;
                ctx.strokeStyle = face.status === 'Identified' ? '#10b981' : '#ef4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                ctx.fillStyle = face.status === 'Identified' ? '#10b981' : '#ef4444';
                ctx.fillRect(x, y - 25, w, 25);

                ctx.fillStyle = 'white';
                ctx.font = '14px Inter';
                const faceLabel = face.status === 'Identified'
                    ? `${face.name || face.student?.name || 'Unknown'}${(face.roll_number || face.student?.roll_number) ? ` (${face.roll_number || face.student?.roll_number})` : ''}`
                    : 'Unknown';
                ctx.fillText(faceLabel, x + 5, y - 8);
            }
        });
    };

    const fetchLogs = async (overrideSessionId = null) => {
        const idToFetch = overrideSessionId || sessionId;
        if (!idToFetch) return;

        try {
            const response = await api.get(`/attendance/logs/${idToFetch}`);
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        }
    };

    const downloadReport = async (format) => {
        try {
            const response = await api.get(`/attendance/export/${sessionId}?format=${format}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${sessionId}.${format === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download report');
        }
        handleCloseMenu();
    };

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const uniqueStudents = new Set(logs.map((log) => log.student_id)).size;
    const presentCount = logs.filter((log) => log.status === 'Present').length;

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Navbar title="Faculty Dashboard" />

            <PageHeader
                title="Attendance Session"
                subtitle="Real-time face recognition attendance tracking"
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {formatTime(sessionTime)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Session Duration
                                        </Typography>
                                    </Box>
                                    <Timer sx={{ fontSize: 40, color: 'primary.light', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                            {uniqueStudents}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Students Detected
                                        </Typography>
                                    </Box>
                                    <People sx={{ fontSize: 40, color: 'success.light', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                            {presentCount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Logs
                                        </Typography>
                                    </Box>
                                    <CheckCircle sx={{ fontSize: 40, color: 'info.light', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Chip
                                            label={isSessionActive ? 'Active' : 'Inactive'}
                                            color={isSessionActive ? 'success' : 'default'}
                                            size="small"
                                            sx={{ mb: 1 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Session Status
                                        </Typography>
                                    </Box>
                                    {isSessionActive ? (
                                        <CheckCircle sx={{ fontSize: 40, color: 'success.light' }} />
                                    ) : (
                                        <Cancel sx={{ fontSize: 40, color: 'text.disabled' }} />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Webcam Section */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Live Camera Feed
                                </Typography>
                                {isSessionActive && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: 'error.main',
                                                animation: 'pulse 2s infinite',
                                                '@keyframes pulse': {
                                                    '0%, 100%': { opacity: 1 },
                                                    '50%': { opacity: 0.5 },
                                                },
                                            }}
                                        />
                                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                            RECORDING
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Section</InputLabel>
                                    <Select
                                        value={selectedSection}
                                        label="Select Section"
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        disabled={isSessionActive}
                                    >
                                        {sections.map((section) => (
                                            <MenuItem key={section.id} value={section.id}>
                                                {section.name} {section.academic_year ? `- ${section.academic_year}` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box
                                sx={{
                                    position: 'relative',
                                    backgroundColor: 'black',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    aspectRatio: '16/9',
                                }}
                            >
                                {uploadedImageSrc ? (
                                    <img
                                        ref={uploadedImgRef}
                                        src={uploadedImageSrc}
                                        alt="Uploaded Preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                        }}
                                        onLoad={() => {
                                            if (detectedFaces.length > 0 && uploadedImgRef.current && canvasRef.current) {
                                                drawBoundingBoxes(detectedFaces, true);
                                            }
                                        }}
                                    />
                                ) : (
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                {!isSessionActive ? (
                                    <>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<PlayArrow />}
                                            onClick={startSession}
                                            disabled={!selectedSection}
                                            sx={{
                                                px: 4,
                                                py: 1.5,
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                },
                                            }}
                                        >
                                            Start Session
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            component="label"
                                            startIcon={<CloudUpload />}
                                            disabled={!selectedSection}
                                            sx={{ px: 4, py: 1.5 }}
                                        >
                                            Test From Image
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Stop />}
                                            onClick={stopSession}
                                            color="error"
                                            disabled={isCompletingSession}
                                            sx={{ px: 4, py: 1.5 }}
                                        >
                                            {isCompletingSession ? 'Completing Session...' : 'Stop Session'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            component="label"
                                            startIcon={<CloudUpload />}
                                            sx={{ px: 4, py: 1.5 }}
                                        >
                                            Upload Image Frame
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Attendance Log Section */}
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Attendance Log
                                </Typography>
                                {logs.length > 0 && (
                                    <IconButton size="small" onClick={handleOpenMenu}>
                                        <MoreVert />
                                    </IconButton>
                                )}
                            </Box>

                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                                <MenuItem onClick={() => downloadReport('csv')}>
                                    <Download sx={{ mr: 1, fontSize: 20 }} />
                                    Download CSV
                                </MenuItem>
                                <MenuItem onClick={() => downloadReport('excel')}>
                                    <Download sx={{ mr: 1, fontSize: 20 }} />
                                    Download Excel
                                </MenuItem>
                            </Menu>

                            {logs.length === 0 ? (
                                <EmptyState
                                    title="No attendance records"
                                    description="Start a session to begin tracking attendance"
                                />
                            ) : (
                                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                                    <List sx={{ p: 0 }}>
                                        {logs.map((log, index) => (
                                            <React.Fragment key={index}>
                                                <ListItem
                                                    sx={{
                                                        px: 0,
                                                        py: 1.5,
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                            borderRadius: 1,
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                    {log.student_name}
                                                                </Typography>
                                                                <Chip
                                                                    label={log.status}
                                                                    size="small"
                                                                    color={log.status === 'Present' ? 'success' : 'default'}
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    {log.roll_number}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < logs.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Session Summary Dialog */}
            <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Session Summary</DialogTitle>
                <DialogContent>
                    {sessionSummary && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {sessionSummary.message}
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {sessionSummary.present_students?.length || 0}
                                        </Typography>
                                        <Typography variant="body2">Present</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {sessionSummary.absent_students?.length || 0}
                                        </Typography>
                                        <Typography variant="body2">Absent</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {sessionSummary.absent_students?.length > 0 && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Absent Students
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sessionSummary.absent_students.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>{student.roll_number}</TableCell>
                                                        <TableCell>{student.name}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button variant="contained" onClick={() => setSummaryOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FacultyDashboard;
