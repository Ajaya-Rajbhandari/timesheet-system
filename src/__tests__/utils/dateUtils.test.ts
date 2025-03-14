import { formatDate, calculateWorkHours } from "../../utils/dateUtils";

describe("Date Utilities", () => {
  test("formatDate formats date correctly", () => {
    const testDate = new Date("2023-01-15T10:30:00");
    expect(formatDate(testDate)).toBe("2023-01-15");
  });

  test("calculateWorkHours returns correct hours between two dates", () => {
    const startTime = new Date("2023-01-15T09:00:00");
    const endTime = new Date("2023-01-15T17:00:00");
    expect(calculateWorkHours(startTime, endTime)).toBe(8);
  });

  test("calculateWorkHours handles invalid dates", () => {
    const startTime = new Date("invalid");
    const endTime = new Date("2023-01-15T17:00:00");
    expect(() => calculateWorkHours(startTime, endTime)).toThrow(
      "Invalid date",
    );
  });
});
