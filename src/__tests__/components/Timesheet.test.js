import { jest } from "@jest/globals";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Timesheet from "../../components/Timesheet";

describe("Timesheet Component", () => {
  const mockEntries = [
    { date: "2024-01-15", hours: 8, project: "Project A", task: "Development" },
    { date: "2024-01-16", hours: 7, project: "Project B", task: "Testing" },
  ];

  test("renders timesheet form", () => {
    render(<Timesheet entries={mockEntries} />);

    expect(screen.getByText(/timesheet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add entry/i }),
    ).toBeInTheDocument();
  });

  test("displays timesheet entries", () => {
    render(<Timesheet entries={mockEntries} />);

    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  test("adds new timesheet entry", () => {
    const mockAddEntry = jest.fn();
    render(<Timesheet entries={mockEntries} onAddEntry={mockAddEntry} />);

    const addButton = screen.getByRole("button", { name: /add entry/i });
    fireEvent.click(addButton);

    const dateInput = screen.getByLabelText(/date/i);
    const hoursInput = screen.getByLabelText(/hours/i);
    const projectInput = screen.getByLabelText(/project/i);
    const taskInput = screen.getByLabelText(/task/i);

    fireEvent.change(dateInput, { target: { value: "2024-01-17" } });
    fireEvent.change(hoursInput, { target: { value: "6" } });
    fireEvent.change(projectInput, { target: { value: "Project C" } });
    fireEvent.change(taskInput, { target: { value: "Planning" } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockAddEntry).toHaveBeenCalledWith({
      date: "2024-01-17",
      hours: "6",
      project: "Project C",
      task: "Planning",
    });
  });

  test("validates hours input", () => {
    render(<Timesheet entries={mockEntries} />);

    const addButton = screen.getByRole("button", { name: /add entry/i });
    fireEvent.click(addButton);

    const hoursInput = screen.getByLabelText(/hours/i);
    fireEvent.change(hoursInput, { target: { value: "25" } });

    expect(
      screen.getByText(/hours must be between 0 and 24/i),
    ).toBeInTheDocument();
  });
});
