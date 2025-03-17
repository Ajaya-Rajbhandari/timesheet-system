import { createContext, useContext, useEffect, useState } from 'react';
import departmentService from '../services/departmentService';

const DepartmentContext = createContext();

// Export the context hook first
export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartments must be used within a DepartmentProvider');
  }
  return context;
};

// Then export the provider
export const DepartmentProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await departmentService.getAll();
        setDepartments(response.data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    
    loadDepartments();
  }, []);

  return (
    <DepartmentContext.Provider value={{ departments }}>
      {children}
    </DepartmentContext.Provider>
  );
};