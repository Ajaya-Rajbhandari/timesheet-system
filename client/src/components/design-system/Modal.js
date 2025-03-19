import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const StyledDialog = styled(Dialog)(
  ({ theme, variant = "default", size = "medium" }) => ({
    "& .MuiDialog-paper": {
      borderRadius: theme.shape.borderRadius * 2,
      ...(size === "small" && { maxWidth: 400 }),
      ...(size === "medium" && { maxWidth: 600 }),
      ...(size === "large" && { maxWidth: 800 }),
      ...(variant === "filled" && {
        backgroundColor: theme.palette.background.paper,
      }),
    },
  }),
);

/**
 * Reusable Modal component with consistent styling and behavior
 * @param {Object} props
 * @param {boolean} props.open - Control modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} [props.title] - Modal title
 * @param {ReactNode} props.children - Modal content
 * @param {ReactNode} [props.actions] - Action buttons
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Modal size
 * @param {'default'|'filled'} [props.variant='default'] - Visual variant
 * @param {boolean} [props.showCloseButton=true] - Show close icon
 * @param {Object} [props.transitionProps] - Dialog transition props
 */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  size,
  variant,
  showCloseButton = true,
  transitionProps,
}) => {
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth={size}
      variant={variant}
      TransitionProps={transitionProps}
    >
      {showCloseButton && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent dividers={variant === "filled"}>{children}</DialogContent>

      {actions && <DialogActions>{actions}</DialogActions>}
    </StyledDialog>
  );
};
