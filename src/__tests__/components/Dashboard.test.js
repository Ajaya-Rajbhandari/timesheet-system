import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "../../components/Dashboard";

describe("Dashboard Component", () => {
  const mockData = {
    totalHours: 40,
    weeklyReport: [
      { date: "2024-01-15", hours: 8 },
      { date: "2024-01-16", hours: 8 },
      { date: "2024-01-17", hours: 8 },
      { date: "2024-01-18", hours: 8 },
      { date: "2024-01-19", hours: 8 },
    ],
    projects: [
      { name: "Project A", hours: 20 },
      { name: "Project B", hours: 20 },
    ],
  };

  test("renders dashboard components", () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/total hours/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly report/i)).toBeInTheDocument();
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
  });

  test("displays total hours", () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText("40")).toBeInTheDocument();
  });

  test("displays project list", () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
  });

  test("displays weekly report", () => {
    render(<Dashboard data={mockData} />);

    mockData.weeklyReport.forEach((day) => {
      const hourElement = screen.getAllByText(day.hours.toString())[0];
      expect(hourElement).toBeInTheDocument();
    });
  });
});
