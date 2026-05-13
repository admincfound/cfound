/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';

// These are loaded from environment variables (see .env.example)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID; 
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

export const sendApplication = async (data: any) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('EmailJS credentials missing. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY.');
    throw new Error('Email configuration is incomplete.');
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: 'admin.cfound@gmail.com',
        from_name: data.fullName,
        from_email: data.email,
        phone: data.phone,
        location: data.location,
        college: data.college,
        qualification: data.qualification,
        year_of_study: data.yearOfStudy,
        start_date: data.startDate,
        domain: data.domain,
        duration: data.duration,
        skills: data.skills,
        portfolio: data.portfolio || 'N/A',
        experience: data.experience,
        reason: data.reason,
        resume_link: 'Attached via email (if configured)', // EmailJS attachments handled via dashboard or specific params
      },
      PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error('EmailJS Error:', error);
    throw error;
  }
};
