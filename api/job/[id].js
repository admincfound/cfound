async function loadJobDetails() {
  try {
    // 1. Grab the path (e.g., /careers/ui-ux-designer-abc123)
    const path = window.location.pathname; 
    
    // 2. Extract ONLY the Firestore document ID at the very end after the last hyphen
    const jobId = path.split('-').pop(); 

    // 3. Request data from your updated API route
    const response = await fetch(`/api/job/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to retrieve job details from database.');
    }
    
    const jobData = await response.json();

    // 4. Update your HTML elements with the actual data fields
    document.getElementById('job-title').textContent = jobData.title || "Job Opportunity";
    document.getElementById('job-location').textContent = jobData.location || "Nagercoil, TN";
    document.getElementById('job-description').innerHTML = jobData.description || "";
    
  } catch (error) {
    console.error("Frontend Render Error:", error);
    document.getElementById('job-container').textContent = "Error loading job listing details.";
  }
}

// Run the function when the page DOM loads
document.addEventListener('DOMContentLoaded', loadJobDetails);