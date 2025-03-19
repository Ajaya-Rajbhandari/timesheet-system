import React from "react";
import { Box } from "@mui/material";

const PageContainer = ({ children }) => (
  <Box
    sx={{
      p: 3,
      width: "100%",
      maxWidth: 1200,
      mx: "auto",
      "& > .MuiPaper-root": {
        borderRadius: 4,
        boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
      },
      "& > .MuiButton-root": {
        mt: 2,
      },
      "& > h6": {
        mb: 3,
      },
    }}
  >
    {children}
  </Box>
);

export default PageContainer;
