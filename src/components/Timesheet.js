import React, { useState } from "react";

const Timesheet = ({ entries, onAddEntry }) => {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [newEntry, setNewEntry] = useState({
    date: "",
    hours: "",
    project: "",
    task: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate hours
    if (name === "hours") {
      const hours = parseInt(value);
      if (hours < 0 || hours > 24) {
        setError("Hours must be between 0 and 24");
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!error) {
      onAddEntry(newEntry);
      setShowForm(false);
      setNewEntry({ date: "", hours: "", project: "", task: "" });
    }
  };

  return (
    <div>
      <h2>Timesheet</h2>

      <button onClick={() => setShowForm(true)}>Add Entry</button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={newEntry.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="hours">Hours</label>
            <input
              id="hours"
              name="hours"
              type="number"
              value={newEntry.hours}
              onChange={handleChange}
              required
            />
            {error && <span>{error}</span>}
          </div>
          <div>
            <label htmlFor="project">Project</label>
            <input
              id="project"
              name="project"
              type="text"
              value={newEntry.project}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="task">Task</label>
            <input
              id="task"
              name="task"
              type="text"
              value={newEntry.task}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Save</button>
        </form>
      )}

      <div>
        {entries.map((entry, index) => (
          <div key={index}>
            <span>{entry.date}</span>
            <span>{entry.hours}</span>
            <span>{entry.project}</span>
            <span>{entry.task}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timesheet;
