import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

export const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 3),
  fontWeight: theme.typography.button.fontWeight,
  fontSize: theme.typography.button.fontSize,
  "&:hover": {
    boxShadow: theme.shadows[2],
  },
}));

export const SecondaryButton = styled(PrimaryButton)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.secondary.dark,
  },
}));
