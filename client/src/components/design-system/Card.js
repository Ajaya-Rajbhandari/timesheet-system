import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  transition: theme.transitions.create(["box-shadow", "transform"], {
    duration: theme.transitions.duration.short,
  }),
}));

export const ElevatedCard = styled(StyledCard)(({ theme }) => ({
  boxShadow: theme.shadows[2],
  "&:hover": {
    boxShadow: theme.shadows[4],
    transform: "translateY(-2px)",
  },
}));

export const OutlinedCard = styled(StyledCard)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    borderColor: theme.palette.primary.main,
  },
}));

export const InteractiveCard = styled(StyledCard)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
