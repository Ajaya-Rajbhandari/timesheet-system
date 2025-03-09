import React from 'react';
import { Card as MuiCard, CardContent, Typography } from '@mui/material';

const Card = ({ title, children }) => {
    return (
        <MuiCard>
            <CardContent>
                <Typography variant="h5">{title}</Typography>
                {children}
            </CardContent>
        </MuiCard>
    );
};

export default Card;
