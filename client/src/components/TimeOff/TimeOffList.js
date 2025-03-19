// ... existing imports ...
import { useDepartments } from "../../context/DepartmentContext";

function TimeOffList() {
  const { user } = useAuth();
  const { departments } = useDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Add to your existing fetch logic
  const fetchRequests = useCallback(async () => {
    try {
      const params = {
        status: selectedStatus,
        ...(user.role === "admin" &&
          selectedDepartment && { department: selectedDepartment }),
        ...(user.role === "manager" && { department: user.department?._id }),
      };

      const response = await timeOffService.getAll(params);
      setRequests(response.data);
    } catch (err) {
      // ... error handling ...
    }
  }, [selectedStatus, selectedDepartment, user]);

  // Add department filter UI
  return (
    <Box sx={{ p: 3 }}>
      {/* Add this filter section */}
      {user.role === "admin" && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Department Filter</InputLabel>
          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            label="Department Filter"
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept._id} value={dept._id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Update your table columns */}
      <Table>
        <TableHead>
          <TableRow>
            {user.role === "admin" && <TableCell>Department</TableCell>}
            <TableCell>Type</TableCell>
            {/* ... rest of columns ... */}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id}>
              {user.role === "admin" && (
                <TableCell>{request.user?.department?.name || "N/A"}</TableCell>
              )}
              <TableCell>{request.type}</TableCell>
              {/* ... rest of cells ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
