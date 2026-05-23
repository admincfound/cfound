/// <reference types="vite/client" />

import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const generateCardsHTML = (
  title: string,
  items: any[],
  fields: { label: string; key: string }[]
) => {

  if (!items || !items.length) {
    return `
      <div style="
        padding:15px;
        border:1px solid #e5e7eb;
        border-radius:12px;
        margin-bottom:15px;
      ">
        No ${title} Added
      </div>
    `;
  }

  return items.map((item, index) => {

    const rows = fields.map(field => `
      <tr>
        <td style="
          padding:10px;
          font-weight:bold;
          border-bottom:1px solid #e5e7eb;
          width:220px;
          vertical-align:top;
        ">
          ${field.label}
        </td>

        <td style="
          padding:10px;
          border-bottom:1px solid #e5e7eb;
        ">
          ${item[field.key] || "-"}
        </td>
      </tr>
    `).join("");

    return `
      <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:14px;
        padding:20px;
        margin-bottom:20px;
      ">

        <h3 style="
          margin-top:0;
          color:#111827;
        ">
          ${title} ${index + 1}
        </h3>

        <table
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="border-collapse:collapse;"
        >
          ${rows}
        </table>

      </div>
    `;

  }).join("");
};

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

  profile?: any;
}) => {

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS credentials missing.");
    return;
  }

  try {

    const profile = data.profile || {};

    const experiencesHTML = generateCardsHTML(
      "Experience",
      profile.experiences || [],
      [
        { label: "Role", key: "role" },
        { label: "Company", key: "company" },
        { label: "Employment Type", key: "employmentType" },
        { label: "Location", key: "location" },
        { label: "Work Mode", key: "workMode" },
        { label: "Description", key: "description" }
      ]
    );

    const projectsHTML = generateCardsHTML(
      "Project",
      profile.projects || [],
      [
        { label: "Title", key: "title" },
        { label: "Category", key: "category" },
        { label: "Technologies", key: "technologies" },
        { label: "Description", key: "description" }
      ]
    );

    const educationHTML = generateCardsHTML(
      "Education",
      profile.education || [],
      [
        { label: "Institution", key: "institution" },
        { label: "Degree", key: "degree" },
        { label: "Department", key: "department" }
      ]
    );

    const certificationsHTML = generateCardsHTML(
      "Certification",
      profile.certifications || [],
      [
        { label: "Certification", key: "name" },
        { label: "Organization", key: "organization" },
        { label: "Credential URL", key: "credentialUrl" }
      ]
    );

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

      admin_email: 'admin.cfound@gmail.com',

      full_name: profile.fullName || profile.displayName || 'N/A',
      email: data.to_email || 'N/A',

      country: profile.country || 'N/A',
      state: profile.state || 'N/A',
      city: profile.city || 'N/A',

      bio: profile.bio || 'N/A',

      experience_level: profile.experienceLevel || 'N/A',

      github: profile.githubUrl || 'N/A',
      linkedin: profile.linkedinUrl || 'N/A',
      portfolio: profile.portfolioUrl || 'N/A',

      experiences: experiencesHTML,
      projects: projectsHTML,
      education: educationHTML,
      certifications: certificationsHTML
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