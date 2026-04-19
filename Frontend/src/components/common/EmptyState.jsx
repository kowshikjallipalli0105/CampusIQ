import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({
    icon: Icon = InboxIcon,
    title = 'No data found',
    description = '',
    action = null
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 2,
                textAlign: 'center',
            }}
        >
            <Icon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.primary" gutterBottom>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                    {description}
                </Typography>
            )}
            {action}
        </Box>
    );
};

export default EmptyState;
