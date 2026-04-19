import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Webcam from 'react-webcam';
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    Grid,
    Chip,
    Card,
    CardContent,
    InputAdornment,
    Tooltip,
    Alert,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    CameraAlt as CameraAltIcon,
    Add as AddIcon,
    Search as SearchIcon,
    PersonAdd,
    School,
    Groups,
    CloudUpload,
    Visibility,
} from '@mui/icons-material';
import Navbar from '../components/layout/Navbar';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';

const AdminDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);

    // Students state
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [editStudentOpen, setEditStudentOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', roll_number: '', email: '', section_id: '' });
    const [editStudent, setEditStudent] = useState({ id: null, name: '', roll_number: '', email: '', section_id: '' });
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [files, setFiles] = useState([]);
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Sections state
    const [sections, setSections] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    const [sectionSearchQuery, setSectionSearchQuery] = useState('');
    const [sectionOpen, setSectionOpen] = useState(false);
    const [editSectionOpen, setEditSectionOpen] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', academic_year: '' });
    const [editSection, setEditSection] = useState({ id: null, name: '', academic_year: '' });

    // Faculty state
    const [faculty, setFaculty] = useState([]);
    const [filteredFaculty, setFilteredFaculty] = useState([]);
    const [facultySearchQuery, setFacultySearchQuery] = useState('');
    const [facultyOpen, setFacultyOpen] = useState(false);
    const [newFaculty, setNewFaculty] = useState({ username: '', password: '' });

    // Section Student View state
    const [viewStudentsDialogOpen, setViewStudentsDialogOpen] = useState(false);
    const [viewStudentsList, setViewStudentsList] = useState([]);
    const [selectedSectionName, setSelectedSectionName] = useState('');

    // Webcam enrollment state
    const [enrollMode, setEnrollMode] = useState('upload');
    const [capturedImages, setCapturedImages] = useState([]);
    const webcamRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const filtered = students.filter(
            (student) =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStudents(filtered);
    }, [searchQuery, students]);

    useEffect(() => {
        const filtered = sections.filter((section) =>
            section.name.toLowerCase().includes(sectionSearchQuery.toLowerCase())
        );
        setFilteredSections(filtered);
    }, [sectionSearchQuery, sections]);

    useEffect(() => {
        const filtered = faculty.filter((f) =>
            f.username.toLowerCase().includes(facultySearchQuery.toLowerCase())
        );
        setFilteredFaculty(filtered);
    }, [facultySearchQuery, faculty]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchStudents(), fetchSections(), fetchFaculty()]);
        setLoading(false);
    };

    const fetchFaculty = async () => {
        try {
            const res = await api.get('/users/');
            const facultyList = res.data.filter(u => u.role === 'faculty');
            setFaculty(facultyList);
            setFilteredFaculty(facultyList);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students/');
            setStudents(res.data);
            setFilteredStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get('/sections/');
            setSections(res.data);
            setFilteredSections(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [credentialsDialog, setCredentialsDialog] = useState(false);
    const [studentCredentials, setStudentCredentials] = useState(null);

    const handleCreateStudent = async () => {
        if (!newStudent.section_id) {
            alert('Please select a section');
            return;
        }
        const formData = new FormData();
        formData.append('name', newStudent.name);
        formData.append('roll_number', newStudent.roll_number);
        formData.append('email', newStudent.email || "");
        formData.append('section_id', newStudent.section_id);
        try {
            const response = await api.post('/students/', formData);
            setOpen(false);
            setNewStudent({ name: '', roll_number: '', section_id: '' });

            // Show credentials dialog
            setStudentCredentials(response.data);
            setCredentialsDialog(true);

            fetchStudents();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to create student');
        }
    };

    const openEditStudentDialog = (student) => {
        setEditStudent({
            id: student.id,
            name: student.name,
            roll_number: student.roll_number,
            email: student.email || '',
            section_id: student.section_id,
        });
        setEditStudentOpen(true);
    };

    const handleUpdateStudent = async () => {
        const formData = new FormData();
        formData.append('name', editStudent.name);
        formData.append('roll_number', editStudent.roll_number);
        formData.append('email', editStudent.email || "");
        formData.append('section_id', editStudent.section_id);

        try {
            await api.put(`/students/${editStudent.id}`, formData);
            setEditStudentOpen(false);
            setEditStudent({ id: null, name: '', roll_number: '', email: '', section_id: '' });
            alert('Student updated successfully');
            fetchStudents();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to update student');
        }
    };

    const handleEnroll = async () => {
        const formData = new FormData();

        if (enrollMode === 'upload') {
            if (!files.length) {
                alert('Please select files');
                return;
            }
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        } else {
            if (capturedImages.length === 0) {
                alert('Please capture at least one image');
                return;
            }
            for (let i = 0; i < capturedImages.length; i++) {
                const blob = await fetch(capturedImages[i]).then((res) => res.blob());
                formData.append('files', blob, `capture_${i}.jpg`);
            }
        }

        try {
            setIsEnrolling(true);
            await api.post(`/students/${selectedStudent}/enroll`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Enrollment successful');
            setEnrollOpen(false);
            setFiles([]);
            setCapturedImages([]);
            setEnrollMode('upload');
            // Refresh student list to update enrollment status
            fetchStudents();
        } catch (error) {
            alert(error.response?.data?.detail || 'Enrollment failed');
        } finally {
            setIsEnrolling(false);
        }
    };

    const captureImage = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setCapturedImages([...capturedImages, imageSrc]);
            }
        }
    };

    const removeCapturedImage = (index) => {
        setCapturedImages(capturedImages.filter((_, i) => i !== index));
    };

    const handleCreateSection = async () => {
        try {
            await api.post('/sections/', newSection);
            setSectionOpen(false);
            setNewSection({ name: '', academic_year: '' });
            fetchSections();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to create section');
        }
    };

    const handleUpdateSection = async () => {
        try {
            await api.put(`/sections/${editSection.id}`, {
                name: editSection.name,
                academic_year: editSection.academic_year,
            });
            setEditSectionOpen(false);
            setEditSection({ id: null, name: '', academic_year: '' });
            fetchSections();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to update section');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section?')) return;
        try {
            await api.delete(`/sections/${sectionId}`);
            fetchSections();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to delete section');
        }
    };

    const openEditDialog = (section) => {
        setEditSection({ id: section.id, name: section.name, academic_year: section.academic_year });
        setEditSectionOpen(true);
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
        try {
            await api.delete(`/students/${studentId}`);
            alert('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to delete student');
        }
    };

    const handleCreateFaculty = async () => {
        try {
            await api.post('/users/', { username: newFaculty.username, password: newFaculty.password, role: 'faculty' });
            setFacultyOpen(false);
            setNewFaculty({ username: '', password: '' });
            fetchFaculty();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to create faculty');
        }
    };

    const handleDeleteFaculty = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
        try {
            await api.delete(`/users/${userId}`);
            alert('Faculty deleted successfully');
            fetchFaculty();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to delete faculty');
        }
    };

    const handleViewStudents = (section) => {
        const sectionStudents = students.filter(s => s.section_id === section.id);
        setViewStudentsList(sectionStudents);
        setSelectedSectionName(section.name);
        setViewStudentsDialogOpen(true);
    };

    if (loading) {
        return <Loader fullScreen />;
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Navbar title="Admin Dashboard" />

            <PageHeader
                title="Dashboard"
                subtitle="Manage students, sections, and enrollments"
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                                            {students.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                            Total Students
                                        </Typography>
                                    </Box>
                                    <PersonAdd sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                                            {sections.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                            Total Sections
                                        </Typography>
                                    </Box>
                                    <School sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                                            {students.filter((s) => s.embeddings?.length > 0).length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                            Enrolled Faces
                                        </Typography>
                                    </Box>
                                    <CameraAltIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                                            Active
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                            System Status
                                        </Typography>
                                    </Box>
                                    <Groups sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Paper sx={{ mb: 3, borderRadius: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                minHeight: 64,
                            },
                        }}
                    >
                        <Tab label="Students" icon={<PersonAdd />} iconPosition="start" />
                        <Tab label="Sections" icon={<School />} iconPosition="start" />
                        <Tab label="Faculty" icon={<Groups />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* Students Tab */}
                {tabValue === 0 && (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <TextField
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="small"
                                sx={{ width: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpen(true)}
                                sx={{ borderRadius: 2 }}
                            >
                                Add Student
                            </Button>
                        </Box>

                        {filteredStudents.length === 0 ? (
                            <EmptyState
                                title="No students found"
                                description="Get started by adding your first student"
                                action={
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                                        Add Student
                                    </Button>
                                }
                            />
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Roll Number</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                Actions
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredStudents.map((student) => (
                                            <TableRow key={student.id} hover>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell>{student.roll_number}</TableCell>
                                                <TableCell>
                                                    {sections.find((s) => s.id === student.section_id)?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={student.embeddings?.length > 0 ? 'Enrolled' : 'Pending'}
                                                        size="small"
                                                        color={student.embeddings?.length > 0 ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Enroll Face">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => {
                                                                setSelectedStudent(student.id);
                                                                setEnrollOpen(true);
                                                            }}
                                                        >
                                                            <CameraAltIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Student Info">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => openEditStudentDialog(student)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Student">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                )}

                {/* Sections Tab */}
                {tabValue === 1 && (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <TextField
                                placeholder="Search sections..."
                                value={sectionSearchQuery}
                                onChange={(e) => setSectionSearchQuery(e.target.value)}
                                size="small"
                                sx={{ width: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setSectionOpen(true)}
                                sx={{ borderRadius: 2 }}
                            >
                                Add Section
                            </Button>
                        </Box>

                        {filteredSections.length === 0 ? (
                            <EmptyState
                                icon={School}
                                title="No sections found"
                                description="Create your first section to organize students"
                                action={
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSectionOpen(true)}>
                                        Add Section
                                    </Button>
                                }
                            />
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Section Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Academic Year</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                Actions
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredSections.map((section) => (
                                            <TableRow key={section.id} hover>
                                                <TableCell>{section.name}</TableCell>
                                                <TableCell>{section.academic_year}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View Students">
                                                        <IconButton size="small" color="info" onClick={() => handleViewStudents(section)}>
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" color="primary" onClick={() => openEditDialog(section)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteSection(section.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                )}

                {/* Faculty Tab */}
                {tabValue === 2 && (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <TextField
                                placeholder="Search faculty..."
                                value={facultySearchQuery}
                                onChange={(e) => setFacultySearchQuery(e.target.value)}
                                size="small"
                                sx={{ width: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setFacultyOpen(true)}
                                sx={{ borderRadius: 2 }}
                            >
                                Add Faculty
                            </Button>
                        </Box>

                        {filteredFaculty.length === 0 ? (
                            <EmptyState
                                icon={Groups}
                                title="No faculty found"
                                description="Add faculty members to the system"
                                action={
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFacultyOpen(true)}>
                                        Add Faculty
                                    </Button>
                                }
                            />
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredFaculty.map((fac) => (
                                            <TableRow key={fac.id} hover>
                                                <TableCell>{fac.username}</TableCell>
                                                <TableCell><Chip label="Faculty" size="small" color="primary" /></TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteFaculty(fac.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                )}
            </Container>

            {/* Create Student Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Add New Student</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Student Name"
                            fullWidth
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                        <TextField
                            label="Roll Number"
                            fullWidth
                            value={newStudent.roll_number}
                            onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                        />
                        <TextField
                            label="Email Address"
                            type="email"
                            fullWidth
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={newStudent.section_id}
                                label="Section"
                                onChange={(e) => setNewStudent({ ...newStudent, section_id: e.target.value })}
                            >
                                {sections.map((section) => (
                                    <MenuItem key={section.id} value={section.id}>
                                        {section.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateStudent}>
                        Create Student
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Student Dialog */}
            <Dialog open={editStudentOpen} onClose={() => setEditStudentOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Edit Student</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Student Name"
                            fullWidth
                            value={editStudent.name}
                            onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                        />
                        <TextField
                            label="Roll Number"
                            fullWidth
                            value={editStudent.roll_number}
                            onChange={(e) => setEditStudent({ ...editStudent, roll_number: e.target.value })}
                        />
                        <TextField
                            label="Email Address"
                            type="email"
                            fullWidth
                            value={editStudent.email}
                            onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={editStudent.section_id}
                                label="Section"
                                onChange={(e) => setEditStudent({ ...editStudent, section_id: e.target.value })}
                            >
                                {sections.map((section) => (
                                    <MenuItem key={section.id} value={section.id}>
                                        {section.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setEditStudentOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateStudent}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Enroll Dialog */}
            <Dialog
                open={enrollOpen}
                onClose={() => {
                    if (isEnrolling) return;
                    setEnrollOpen(false);
                    setCapturedImages([]);
                    setFiles([]);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Enroll Student Face</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        {isEnrolling && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Please wait, face enrollment is processing...
                            </Alert>
                        )}

                        <ToggleButtonGroup
                            value={enrollMode}
                            exclusive
                            onChange={(e, newMode) => {
                                if (newMode) setEnrollMode(newMode);
                            }}
                            sx={{ mb: 3 }}
                            fullWidth
                            disabled={isEnrolling}
                        >
                            <ToggleButton value="upload">
                                <CloudUpload sx={{ mr: 1 }} />
                                Upload Files
                            </ToggleButton>
                            <ToggleButton value="webcam">
                                <CameraAltIcon sx={{ mr: 1 }} />
                                Webcam Capture
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {enrollMode === 'upload' ? (
                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    backgroundColor: 'background.default',
                                }}
                            >
                                <CloudUpload sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Select multiple images of the student's face
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setFiles(e.target.files)}
                                    disabled={isEnrolling}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outlined" component="span" disabled={isEnrolling}>
                                        Choose Files
                                    </Button>
                                </label>
                                {files.length > 0 && (
                                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                                        {files.length} file(s) selected
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box>
                                <Paper sx={{ p: 2, mb: 2, bgcolor: 'black', borderRadius: 2 }}>
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        width="100%"
                                        videoConstraints={{ facingMode: 'user' }}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Paper>
                                <Button
                                    variant="contained"
                                    startIcon={<CameraAltIcon />}
                                    onClick={captureImage}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    disabled={capturedImages.length >= 5 || isEnrolling}
                                >
                                    Capture Image ({capturedImages.length}/5)
                                </Button>
                                {capturedImages.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Captured Images:
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {capturedImages.map((img, index) => (
                                                <Grid item xs={4} key={index}>
                                                    <Box sx={{ position: 'relative' }}>
                                                        <img
                                                            src={img}
                                                            alt={`Capture ${index + 1}`}
                                                            style={{ width: '100%', borderRadius: 8 }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeCapturedImage(index)}
                                                            disabled={isEnrolling}
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                bgcolor: 'background.paper',
                                                                '&:hover': { bgcolor: 'error.main', color: 'white' },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        disabled={isEnrolling}
                        onClick={() => {
                            setEnrollOpen(false);
                            setCapturedImages([]);
                            setFiles([]);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleEnroll} disabled={isEnrolling}>
                        {isEnrolling ? 'Please wait...' : 'Enroll'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Faculty Dialog */}
            <Dialog open={facultyOpen} onClose={() => setFacultyOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Add New Faculty</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Username"
                            fullWidth
                            value={newFaculty.username}
                            onChange={(e) => setNewFaculty({ ...newFaculty, username: e.target.value })}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={newFaculty.password}
                            onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setFacultyOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateFaculty}>
                        Create Faculty
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Section Dialog */}
            <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Add New Section</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Section Name"
                            fullWidth
                            value={newSection.name}
                            onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        />
                        <TextField
                            label="Academic Year"
                            fullWidth
                            value={newSection.academic_year}
                            onChange={(e) => setNewSection({ ...newSection, academic_year: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setSectionOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSection}>
                        Create Section
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Section Dialog */}
            <Dialog open={editSectionOpen} onClose={() => setEditSectionOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Edit Section</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Section Name"
                            fullWidth
                            value={editSection.name}
                            onChange={(e) => setEditSection({ ...editSection, name: e.target.value })}
                        />
                        <TextField
                            label="Academic Year"
                            fullWidth
                            value={editSection.academic_year}
                            onChange={(e) => setEditSection({ ...editSection, academic_year: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setEditSectionOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateSection}>
                        Update Section
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Students in Section Dialog */}
            <Dialog open={viewStudentsDialogOpen} onClose={() => setViewStudentsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Students in {selectedSectionName}
                </DialogTitle>
                <DialogContent>
                    {viewStudentsList.length === 0 ? (
                        <EmptyState
                            title="No students found"
                            description="There are no students enrolled in this section yet."
                        />
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Roll Number</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {viewStudentsList.map((student) => (
                                        <TableRow key={student.id} hover>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.roll_number}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={student.embeddings?.length > 0 ? 'Enrolled' : 'Pending'}
                                                    size="small"
                                                    color={student.embeddings?.length > 0 ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Delete Student">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            if (window.confirm('Delete this student from the section?')) {
                                                                handleDeleteStudent(student.id);
                                                                // Update the local list to reflect deletion immediately
                                                                setViewStudentsList(prev => prev.filter(s => s.id !== student.id));
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewStudentsDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Student Credentials Dialog */}
            <Dialog
                open={credentialsDialog}
                onClose={() => setCredentialsDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600, bgcolor: 'success.light', color: 'white' }}>
                    ✅ Student Account Created
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {studentCredentials && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Share these credentials with the student. They will be required to change their password on first login.
                            </Alert>

                            <Paper sx={{ p: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Student Name
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {studentCredentials.name}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Username
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                                {studentCredentials.username}
                                            </Typography>
                                            <Chip label="Username" size="small" color="primary" />
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Initial Password
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                                {studentCredentials.initial_password}
                                            </Typography>
                                            <Chip label="Password" size="small" color="secondary" />
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>

                            <Alert severity="warning" sx={{ mt: 3 }}>
                                <strong>Important:</strong> The student must change this password on their first login for security.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => setCredentialsDialog(false)}
                        fullWidth
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default AdminDashboard;
