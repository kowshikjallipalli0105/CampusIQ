import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const PageHeader = ({ title, subtitle, action }) => {
    return (
        <Box
            sx={{
                backgroundColor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 3,
            }}
        >
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {action && <Box>{action}</Box>}
                </Box>
            </Container>
        </Box>
    );
};

export default PageHeader;
