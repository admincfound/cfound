/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendApplicationEmail = async (data: { 
  to_name: string; 
  to_email: string; 
  role_title: string; 
  application_type: string;
  user_name: string;
  phone?: string;
  skills?: string;
  resume_url?: string;
  portfolio_url?: string;
  user_id?: string;
}) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS credentials missing. Email not sent.");
    return;
  }

  try {
    // We send payload to emailJS. User can map these fields to templates.
    const payload = {
      to_name: data.user_name,
      to_email: data.to_email,
      role_title: data.role_title,
      application_type: data.application_type,
      reply_to: 'admin.cfound@gmail.com',
      from_name: 'C Found',
      phone: data.phone || 'N/A',
      skills: data.skills || 'N/A',
      resume_url: data.resume_url || 'N/A',
      portfolio_url: data.portfolio_url || 'N/A',
      user_id: data.user_id || 'N/A',
      timestamp: new Date().toLocaleString(),
      admin_email: 'admin.cfound@gmail.com'
    };

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      payload,
      PUBLIC_KEY
    );
    return result;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};
