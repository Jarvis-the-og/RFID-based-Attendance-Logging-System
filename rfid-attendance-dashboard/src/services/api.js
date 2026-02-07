// Base URL for your backend API or Aiven database endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fetch all attendance records
export const fetchAttendanceData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance`);
    if (!response.ok) throw new Error('Failed to fetch attendance data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

// Add new RFID card
export const addRFIDCard = async (rfidData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rfid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rfidData),
    });
    if (!response.ok) throw new Error('Failed to add RFID card');
    return await response.json();
  } catch (error) {
    console.error('Error adding RFID:', error);
    throw error;
  }
};

// Update attendance status
export const updateAttendanceStatus = async (rfid, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/${rfid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

// Delete RFID card
export const deleteRFIDCard = async (rfid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rfid/${rfid}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete RFID card');
    return await response.json();
  } catch (error) {
    console.error('Error deleting RFID:', error);
    throw error;
  }
};