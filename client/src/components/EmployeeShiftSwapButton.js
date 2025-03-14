import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import ShiftSwap from "./ShiftSwap";
import ShiftSwapHistory from "./ShiftSwapHistory";

const EmployeeShiftSwapButton = ({ schedule }) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shiftSwapDialogOpen, setShiftSwapDialogOpen] = useState(false);
  const [shiftSwapHistoryOpen, setShiftSwapHistoryOpen] = useState(false);

  const handleRequestShiftSwap = () => {
    setShiftSwapDialogOpen(true);
    setOptionsOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => setOptionsOpen(true)}
        startIcon={<SwapHorizIcon />}
      >
        Shift Options
      </Button>

      {/* Options Dialog */}
      <Dialog
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Schedule Options</DialogTitle>
        <List>
          <ListItem button onClick={handleRequestShiftSwap}>
            <ListItemIcon>
              <SwapHorizIcon />
            </ListItemIcon>
            <ListItemText primary="Request Shift Swap" />
          </ListItem>
          <ListItem
            button
            onClick={() => {
              setOptionsOpen(false);
              setShiftSwapHistoryOpen(true);
            }}
          >
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText primary="View Shift Swap History" />
          </ListItem>
        </List>
        <DialogActions>
          <Button onClick={() => setOptionsOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Shift Swap Dialog */}
      <ShiftSwap
        open={shiftSwapDialogOpen}
        onClose={() => setShiftSwapDialogOpen(false)}
        schedule={schedule}
      />

      {/* Shift Swap History Dialog */}
      <Dialog
        open={shiftSwapHistoryOpen}
        onClose={() => setShiftSwapHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Shift Swap History</DialogTitle>
        <DialogContent>
          <ShiftSwapHistory />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftSwapHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeeShiftSwapButton;
