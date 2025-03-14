import React from "react";

const Dashboard = ({ data }) => {
  return (
    <div>
      <h1>Dashboard</h1>

      <section>
        <h2>Total Hours</h2>
        <div>{data.totalHours}</div>
      </section>

      <section>
        <h2>Weekly Report</h2>
        <div>
          {data.weeklyReport.map((day, index) => (
            <div key={index}>
              <span>{day.date}</span>
              <span>{day.hours}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Projects</h2>
        <div>
          {data.projects.map((project, index) => (
            <div key={index}>
              <span>{project.name}</span>
              <span>{project.hours}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
