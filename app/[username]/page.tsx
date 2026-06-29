"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { resolveUidForUsername } from '../lib/usernameUtils';
import {
  MapPin, Eye, Download, Users, Calendar, ShieldCheck, Briefcase,
  BookOpen, Globe, Github, Linkedin, ExternalLink, Copy, Check,
  CheckCircle, Code2, GraduationCap, Award, Phone, Mail, Share2,
  Loader2, UserX, BookMarked, FileText, FileDown, X, LogIn
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicProfile {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  // New career identity fields (added v2)
  careerStatus?: string;       // "Student" | "Fresher" | "Working Professional" | "Freelancer" | "Founder" | "Self Employed"
  currentJobTitle?: string;    // e.g. "HR Administrator"
  currentCompany?: string;     // e.g. "Surabi Windfarms Technologies Pvt Ltd"
  // Legacy role fields — kept for backward compat
  primaryRole?: string;
  secondaryRole?: string;
  /** @deprecated */ currentRole?: string;
  country?: string;
  state?: string;
  city?: string;
  bio?: string;
  /** @deprecated */ about?: string;
  skills?: string[];
  experienceLevel?: string;
  languages?: { name: string; level: string }[];
  experiences?: {
    role: string; company: string; type?: string; location?: string; mode?: string;
    startMonth?: string; startYear: string; endMonth?: string; endYear?: string;
    current?: boolean; skills?: string; description?: string;
  }[];
  /** @deprecated */ experience?: {
    title: string; company: string;
    startDate: string; endDate?: string; current?: boolean; description?: string;
  }[];
  education?: {
    institution: string; degree: string; department?: string;
    startYear: string; endYear?: string; current?: boolean; grade?: string;
  }[];
  projects?: {
    title: string; category?: string; description?: string;
    technologies?: string; skills?: string;
    startMonth?: string; startYear?: string; endMonth?: string; endYear?: string;
    status?: string; demoUrl?: string; githubUrl?: string;
  }[];
  certifications?: {
    name: string; org: string; issueMonth?: string; issueYear?: string; url?: string;
  }[];
  /** @deprecated */ certificates?: { name: string; issuer: string; date?: string; issuerIcon?: string }[];
  publications?: {
    title: string; publisher: string; dateMonth?: string; dateYear?: string; url?: string;
  }[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  behanceUrl?: string;
  artstationUrl?: string;
  youtubeUrl?: string;
  otherUrl?: string;
  email?: string;
  phone?: string;
  openToWork?: boolean;
  /** @deprecated */ isOpenToWork?: boolean;
  viewCount?: number;
  downloadCount?: number;
  connectionCount?: number;
  createdAt?: any;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function getOpenToWork(p: PublicProfile) { return p.openToWork ?? p.isOpenToWork ?? false; }
function getAbout(p: PublicProfile) { return p.bio || p.about || ''; }

// ─── Career identity helpers ──────────────────────────────────────────────────
// Derives a structured identity from either the new v2 fields or legacy primaryRole/secondaryRole.

const CAREER_STATUS_OPTIONS = [
  'Student', 'Fresher', 'Working Professional', 'Freelancer', 'Founder', 'Self Employed',
];

function getCareerStatus(p: PublicProfile): string {
  // New field wins
  if (p.careerStatus) return p.careerStatus;
  // Map legacy secondaryRole if it matches a known status
  if (p.secondaryRole && CAREER_STATUS_OPTIONS.includes(p.secondaryRole)) return p.secondaryRole;
  // Heuristic from experienceLevel
  if (p.experienceLevel === 'fresher' || p.experienceLevel === 'entry') return 'Fresher';
  if (p.experienceLevel === 'student') return 'Student';
  return '';
}

interface CareerIdentity {
  jobTitle: string;   // Current professional title
  company: string;    // Current org / college
  status: string;     // Career status label
}

function getCareerIdentity(p: PublicProfile): CareerIdentity {
  const status = getCareerStatus(p);

  // New explicit fields
  if (p.currentJobTitle) {
    return {
      jobTitle: p.currentJobTitle,
      company: p.currentCompany || '',
      status,
    };
  }

  // Derive from most recent experience entry
  const exps = getExperiences(p);
  const currentExp = exps.find(e => e.dateRange.includes('Present')) ?? exps[0];

  if (currentExp) {
    const suffix = status === 'Fresher' ? ' (Fresher)' : '';
    return {
      jobTitle: currentExp.title + suffix,
      company: currentExp.company,
      status,
    };
  }

  // Fall back to legacy primaryRole as title
  const legacyTitle = p.primaryRole || p.currentRole || '';
  return {
    jobTitle: legacyTitle,
    company: '',
    status,
  };
}

interface NormExp { title: string; company: string; dateRange: string; description?: string; location?: string; type?: string; }
function getExperiences(p: PublicProfile): NormExp[] {
  if (p.experiences?.length) {
    return p.experiences.map(e => ({
      title: e.role, company: e.company,
      dateRange: `${[e.startMonth, e.startYear].filter(Boolean).join(' ')} – ${e.current ? 'Present' : [e.endMonth, e.endYear].filter(Boolean).join(' ') || 'Present'}`,
      description: e.description, location: e.location, type: e.type,
    }));
  }
  if (p.experience?.length) {
    return p.experience.map(e => ({
      title: e.title, company: e.company,
      dateRange: `${e.startDate} – ${e.current ? 'Present' : e.endDate}`,
      description: e.description,
    }));
  }
  return [];
}

interface NormCert { name: string; issuer: string; date?: string; url?: string; }
function getCertifications(p: PublicProfile): NormCert[] {
  if (p.certifications?.length) {
    return p.certifications.map(c => ({ name: c.name, issuer: c.org, date: [c.issueMonth, c.issueYear].filter(Boolean).join(' ') || undefined, url: c.url }));
  }
  if (p.certificates?.length) {
    return p.certificates.map(c => ({ name: c.name, issuer: c.issuer, date: c.date }));
  }
  return [];
}

interface NormProject { title: string; subtitle?: string; description?: string; tech: string[]; demoUrl?: string; githubUrl?: string; }
function getProjects(p: PublicProfile): NormProject[] {
  if (!p.projects?.length) return [];
  return p.projects.map(proj => {
    const techSource = proj.technologies || proj.skills || '';
    const tech = techSource.split(',').map(t => t.trim()).filter(Boolean);
    return { title: proj.title, subtitle: proj.category, description: proj.description, tech, demoUrl: proj.demoUrl, githubUrl: proj.githubUrl };
  });
}

// ─── View Count Dedup ─────────────────────────────────────────────────────────

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldCountView(profileUid: string): boolean {
  try {
    const key = `cfound_view_${profileUid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (Date.now() - ts < VIEW_COOLDOWN_MS) return false;
    }
    localStorage.setItem(key, String(Date.now()));
    return true;
  } catch { return true; }
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function generateResumePDF(profile: PublicProfile): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, marginL = 20, marginR = 20, contentW = W - marginL - marginR;
  let y = 20;

  const colors = {
    heading: [15, 23, 42] as [number, number, number],
    accent: [37, 99, 235] as [number, number, number],
    text: [55, 65, 81] as [number, number, number],
    muted: [107, 114, 128] as [number, number, number],
    border: [229, 231, 235] as [number, number, number],
  };

  function addPage() {
    doc.addPage();
    y = 20;
  }

  function checkPage(needed = 10) {
    if (y + needed > 270) addPage();
  }

  function hline(color = colors.border) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, W - marginR, y);
    y += 4;
  }

  function sectionTitle(title: string) {
    checkPage(14);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.text(title.toUpperCase(), marginL, y);
    y += 3;
    hline(colors.accent);
  }

  function wrapText(text: string, x: number, startY: number, maxW: number, fontSize: number, color: [number,number,number], fontStyle = 'normal'): number {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      checkPage(fontSize * 0.5 + 2);
      doc.text(line, x, startY === -1 ? y : startY);
      if (startY === -1) y += fontSize * 0.45 + 1;
      else startY += fontSize * 0.45 + 1;
    }
    return startY === -1 ? y : startY;
  }

  // ── Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colors.heading);
  doc.text(profile.displayName || 'Professional Resume', marginL, y);
  y += 8;

  // Use identity-aware title for PDF header
  const pdfIdentity = getCareerIdentity(profile);
  const pdfTitle = [pdfIdentity.jobTitle, pdfIdentity.company].filter(Boolean).join(' · ') || pdfIdentity.status || '';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...colors.accent);
  if (pdfTitle) { doc.text(pdfTitle, marginL, y); }
  y += 6;

  // Contact row
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.city || profile.country) contactParts.push([profile.city, profile.country].filter(Boolean).join(', '));
  if (profile.portfolioUrl) contactParts.push(profile.portfolioUrl.replace(/^https?:\/\//, ''));
  if (contactParts.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.muted);
    doc.text(contactParts.join('  ·  '), marginL, y);
    y += 5;
  }

  // Social links
  const socialParts: string[] = [];
  if (profile.linkedinUrl) socialParts.push(profile.linkedinUrl.replace(/^https?:\/\//, ''));
  if (profile.githubUrl) socialParts.push(profile.githubUrl.replace(/^https?:\/\//, ''));
  if (socialParts.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.muted);
    doc.text(socialParts.join('  ·  '), marginL, y);
    y += 5;
  }

  hline();

  // ── About ──
  const about = getAbout(profile);
  if (about) {
    sectionTitle('Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.text);
    const aboutLines = doc.splitTextToSize(about.substring(0, 800), contentW);
    for (const line of aboutLines) {
      checkPage(6);
      doc.text(line, marginL, y);
      y += 4.5;
    }
    y += 2;
  }

  // ── Experience ──
  const experiences = getExperiences(profile);
  if (experiences.length) {
    sectionTitle('Experience');
    for (const exp of experiences) {
      checkPage(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.heading);
      doc.text(exp.title, marginL, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      const dateW = doc.getTextWidth(exp.dateRange);
      doc.text(exp.dateRange, W - marginR - dateW, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.accent);
      doc.text(exp.company, marginL, y);
      if (exp.location) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.muted);
        doc.text(` · ${exp.location}`, marginL + doc.getTextWidth(exp.company) + 1, y);
      }
      y += 5;

      if (exp.description) {
        const lines = exp.description.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const clean = line.replace(/^[\s]*[-*•]\s+/, '');
          const isBullet = /^[\s]*[-*•]\s+/.test(line);
          const prefix = isBullet ? '•  ' : '';
          const wrapped = doc.splitTextToSize(prefix + clean, contentW - (isBullet ? 4 : 0));
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...colors.text);
          for (const wl of wrapped) {
            checkPage(5);
            doc.text(wl, marginL + (isBullet ? 4 : 0), y);
            y += 4.5;
          }
        }
      }
      y += 4;
    }
  }

  // ── Education ──
  if (profile.education?.length) {
    sectionTitle('Education');
    for (const edu of profile.education) {
      checkPage(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.heading);
      doc.text(edu.degree, marginL, y);

      const dateStr = `${edu.startYear} – ${edu.current ? 'Present' : (edu.endYear || 'Present')}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      doc.text(dateStr, W - marginR - doc.getTextWidth(dateStr), y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.accent);
      doc.text(edu.institution, marginL, y);
      if (edu.grade) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.muted);
        doc.text(`  ·  CGPA: ${edu.grade}`, marginL + doc.getTextWidth(edu.institution), y);
      }
      y += 8;
    }
  }

  // ── Skills ──
  if (profile.skills?.length) {
    sectionTitle('Skills');
    const skillsText = profile.skills.join('  ·  ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.text);
    const skillLines = doc.splitTextToSize(skillsText, contentW);
    for (const line of skillLines) {
      checkPage(5);
      doc.text(line, marginL, y);
      y += 4.5;
    }
    y += 3;
  }

  // ── Projects ──
  const projects = getProjects(profile);
  if (projects.length) {
    sectionTitle('Projects');
    for (const proj of projects) {
      checkPage(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.heading);
      doc.text(proj.title, marginL, y);
      if (proj.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.muted);
        doc.text(` · ${proj.subtitle}`, marginL + doc.getTextWidth(proj.title) + 1, y);
      }
      y += 5;

      if (proj.tech.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.accent);
        doc.text(proj.tech.join(', '), marginL, y);
        y += 5;
      }

      if (proj.description) {
        const descLines = doc.splitTextToSize(proj.description.substring(0, 400), contentW);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        for (const dl of descLines) {
          checkPage(5);
          doc.text(dl, marginL, y);
          y += 4.5;
        }
      }
      y += 4;
    }
  }

  // ── Certifications ──
  const certifications = getCertifications(profile);
  if (certifications.length) {
    sectionTitle('Certifications');
    for (const cert of certifications) {
      checkPage(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...colors.heading);
      doc.text(cert.name, marginL, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      doc.text([cert.issuer, cert.date].filter(Boolean).join(' · '), marginL, y);
      y += 7;
    }
  }

  // ── Publications ──
  const publications = profile.publications || [];
  if (publications.length) {
    sectionTitle('Publications');
    for (const pub of publications) {
      checkPage(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...colors.heading);
      const pubLines = doc.splitTextToSize(pub.title, contentW - 30);
      for (const pl of pubLines) { doc.text(pl, marginL, y); y += 4.5; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      const pubMeta = [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
      doc.text(pubMeta, marginL, y);
      y += 7;
    }
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.muted);
    const footerText = `Generated via C Found · cfound.in/${profile.username || profile.uid}`;
    doc.text(footerText, marginL, 287);
    doc.text(`${i} / ${pageCount}`, W - marginR - doc.getTextWidth(`${i} / ${pageCount}`), 287);
  }

  doc.save(`${(profile.displayName || 'resume').replace(/\s+/g, '_')}_Resume.pdf`);
}

// ─── DOCX Generation (owner only) ────────────────────────────────────────────

async function generateResumeDOCX(profile: PublicProfile): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopPosition, TabStopType, BorderStyle, Table, TableRow, TableCell, WidthType } = await import('docx');

  const experiences = getExperiences(profile);
  const certifications = getCertifications(profile);
  const projects = getProjects(profile);
  const about = getAbout(profile);

  function makeDivider() {
    return new Paragraph({
      border: { bottom: { color: '2563EB', style: BorderStyle.SINGLE, size: 4 } },
      spacing: { after: 80 },
    });
  }

  function sectionHeading(text: string) {
    return [
      new Paragraph({
        spacing: { before: 200, after: 40 },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: '2563EB', font: 'Calibri' })],
      }),
      makeDivider(),
    ];
  }

  const children: any[] = [];

  // Header
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: profile.displayName || 'Professional Resume', bold: true, size: 48, font: 'Calibri', color: '0F172A' })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: (() => {
        const id = getCareerIdentity(profile);
        return [id.jobTitle, id.company].filter(Boolean).join(' · ') || id.status || '';
      })(), size: 22, color: '2563EB', font: 'Calibri' })],
    }),
  );

  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.city || profile.country) contactParts.push([profile.city, profile.country].filter(Boolean).join(', '));
  if (profile.portfolioUrl) contactParts.push(profile.portfolioUrl.replace(/^https?:\/\//, ''));

  if (contactParts.length) {
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: contactParts.join('  ·  '), size: 18, color: '6B7280', font: 'Calibri' })],
    }));
  }

  const socialParts: string[] = [];
  if (profile.linkedinUrl) socialParts.push(profile.linkedinUrl.replace(/^https?:\/\//, ''));
  if (profile.githubUrl) socialParts.push(profile.githubUrl.replace(/^https?:\/\//, ''));
  if (socialParts.length) {
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: socialParts.join('  ·  '), size: 18, color: '6B7280', font: 'Calibri' })],
    }));
  }

  // Summary
  if (about) {
    children.push(...sectionHeading('Summary'));
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: about, size: 20, font: 'Calibri', color: '374151' })],
    }));
  }

  // Experience
  if (experiences.length) {
    children.push(...sectionHeading('Experience'));
    for (const exp of experiences) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22, font: 'Calibri', color: '0F172A' }),
            new TextRun({ text: '\t' + exp.dateRange, size: 18, color: '6B7280', font: 'Calibri' }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: exp.company, bold: true, size: 18, color: '2563EB', font: 'Calibri' })],
        }),
      );
      if (exp.description) {
        const lines = exp.description.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const clean = line.replace(/^[\s]*[-*•]\s+/, '');
          const isBullet = /^[\s]*[-*•]\s+/.test(line);
          children.push(new Paragraph({
            spacing: { after: 40 },
            bullet: isBullet ? { level: 0 } : undefined,
            children: [new TextRun({ text: clean, size: 19, font: 'Calibri', color: '374151' })],
          }));
        }
      }
      children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    }
  }

  // Education
  if (profile.education?.length) {
    children.push(...sectionHeading('Education'));
    for (const edu of profile.education) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22, font: 'Calibri', color: '0F172A' }),
            new TextRun({ text: `\t${edu.startYear} – ${edu.current ? 'Present' : (edu.endYear || 'Present')}`, size: 18, color: '6B7280', font: 'Calibri' }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: edu.institution, bold: true, size: 18, color: '2563EB', font: 'Calibri' }),
            ...(edu.grade ? [new TextRun({ text: `  ·  CGPA: ${edu.grade}`, size: 18, color: '6B7280', font: 'Calibri' })] : []),
          ],
        }),
      );
    }
  }

  // Skills
  if (profile.skills?.length) {
    children.push(...sectionHeading('Skills'));
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: profile.skills.join('  ·  '), size: 19, font: 'Calibri', color: '374151' })],
    }));
  }

  // Projects
  if (projects.length) {
    children.push(...sectionHeading('Projects'));
    for (const proj of projects) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: proj.title, bold: true, size: 22, font: 'Calibri', color: '0F172A' })],
        }),
      );
      if (proj.tech.length) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: proj.tech.join(', '), size: 18, color: '2563EB', font: 'Calibri' })],
        }));
      }
      if (proj.description) {
        children.push(new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: proj.description, size: 19, font: 'Calibri', color: '374151' })],
        }));
      }
      children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    }
  }

  // Certifications
  if (certifications.length) {
    children.push(...sectionHeading('Certifications'));
    for (const cert of certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: cert.name, bold: true, size: 20, font: 'Calibri', color: '0F172A' })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: [cert.issuer, cert.date].filter(Boolean).join(' · '), size: 18, color: '6B7280', font: 'Calibri' })],
        }),
      );
    }
  }

  // Publications
  const pubs = profile.publications || [];
  if (pubs.length) {
    children.push(...sectionHeading('Publications'));
    for (const pub of pubs) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: pub.title, bold: true, size: 20, font: 'Calibri', color: '0F172A' })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join(' · '), size: 18, color: '6B7280', font: 'Calibri' })],
        }),
      );
    }
  }

  const docx = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(docx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(profile.displayName || 'resume').replace(/\s+/g, '_')}_Resume.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormattedText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(l => l.trim().length > 0);
        const isBulletBlock = lines.length > 1 && lines.every(l => /^[\s]*[-*•]\s+/.test(l));
        if (isBulletBlock) {
          return (
            <ul key={i} className="space-y-1.5 list-disc pl-4 marker:text-gray-300">
              {lines.map((line, j) => (
                <li key={j} className="break-words text-gray-500">
                  {line.replace(/^[\s]*[-*•]\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="whitespace-pre-line break-words">{block.trim()}</p>;
      })}
    </div>
  );
}

// ─── Login Modal ─────────────────────────────────────────────────────────────

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 italic uppercase">Sign In Required</h2>
              <p className="text-sm text-gray-500 mt-1">Create an account or sign in to download resumes.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 text-sm font-bold transition-colors"
              onClick={onClose}
            >
              <LogIn size={15} />
              Log In
            </Link>
            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-bold transition-colors"
              onClick={onClose}
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="w-1 h-5 bg-blue-600 rounded-full shrink-0" />
      <span className="text-blue-600 shrink-0">{icon}</span>
      <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://cfound.in/${username}`;
  const isOwnProfile = user?.uid === profile?.uid;

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const snap = await getDocs(q);

      let data: PublicProfile | null = null;
      let resolvedDocId: string | null = null;

      if (!snap.empty) {
        data = { uid: snap.docs[0].id, ...snap.docs[0].data() } as PublicProfile;
        resolvedDocId = snap.docs[0].id;
      } else {
        const ownerUid = await resolveUidForUsername(username);
        if (ownerUid) {
          const ownerSnap = await getDoc(doc(db, 'users', ownerUid));
          if (ownerSnap.exists()) {
            data = { uid: ownerSnap.id, ...ownerSnap.data() } as PublicProfile;
            resolvedDocId = ownerSnap.id;
          }
        }
      }

      if (!data) {
        const docRef = doc(db, 'users', username);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          data = { uid: docSnap.id, ...docSnap.data() } as PublicProfile;
          resolvedDocId = docSnap.id;
        }
      }

      if (!data || !resolvedDocId) { setNotFound(true); return; }

      setProfile(data);

      // Only count view if: not own profile + not seen in last 24h
      if (user?.uid !== data.uid && shouldCountView(data.uid)) {
        updateDoc(doc(db, 'users', resolvedDocId), { viewCount: increment(1) }).catch(() => {});
      }
    } catch (err) {
      console.error('Public profile error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = useCallback(async (format: 'pdf' | 'docx') => {
    if (!profile) return;

    // DOCX: owner only
    if (format === 'docx' && !isOwnProfile) {
      if (!user) { setShowLoginModal(true); return; }
      // logged in but not owner — only pdf allowed
      toast.error('Only the profile owner can download DOCX.');
      return;
    }

    // PDF: owner + logged-in users get it; guests get PDF too (no login required for PDF)
    if (format === 'pdf' && !user && !isOwnProfile) {
      // guests CAN download PDF — no gate
    }

    setIsDownloading(true);
    try {
      if (format === 'pdf') {
        await generateResumePDF(profile);
        // Increment download count
        updateDoc(doc(db, 'users', profile.uid), { downloadCount: increment(1) }).catch(() => {});
        toast.success('Resume downloaded!');
      } else {
        await generateResumeDOCX(profile);
        toast.success('Resume downloaded!');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [profile, isOwnProfile, user]);

  const memberSince = (() => {
    if (!profile?.createdAt) return 'N/A';
    try {
      const d = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { return 'N/A'; }
  })();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Loading profile</p>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UserX size={28} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-black italic uppercase text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">
            The user <span className="text-gray-600 font-bold break-all">@{username}</span> doesn't exist or hasn't set up their profile yet.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-bold transition-colors">
            Back to C Found
          </Link>
        </div>
      </div>
    );
  }

  const isOpenToWork = getOpenToWork(profile);
  const about = getAbout(profile);
  const experiences = getExperiences(profile);
  const certifications = getCertifications(profile);
  const projects = getProjects(profile);
  const publications = profile.publications || [];
  const identity = getCareerIdentity(profile);

  const socialLinks = { linkedin: profile.linkedinUrl, github: profile.githubUrl, website: profile.portfolioUrl };
  const contact = { email: profile.email, phone: profile.phone, website: profile.portfolioUrl };

  // ── Profile Page ─────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F8F9FB] min-h-screen pb-20">

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <span className="text-base font-black text-blue-600 italic uppercase tracking-tight">C Found</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Share2 size={13} />}
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Download button(s) */}
            {isOwnProfile ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownload('pdf')}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-3 py-2 text-xs font-bold transition-colors"
                >
                  {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                  PDF
                </button>
                <button
                  onClick={() => handleDownload('docx')}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
                >
                  {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                  DOCX
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleDownload('pdf')}
                disabled={isDownloading}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-3 py-2 text-xs font-bold transition-colors"
              >
                {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                <span>Resume</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Banner */}
          <div
            className="relative rounded-t-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0c1628 0%, #152348 40%, #1d3580 70%, #2563eb 100%)', height: '120px' }}
          >
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {isOpenToWork && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-300 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Open to Work
                </span>
              </div>
            )}
          </div>

          {/* Profile card below banner */}
          <div className="bg-white rounded-b-2xl border border-gray-100 border-t-0 shadow-sm px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-blue-900">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                      {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                  <ShieldCheck size={11} className="text-white" />
                </div>
              </div>

              {/* Name block */}
              <div className="flex-1 min-w-0 pt-3 sm:pt-0 pb-1">
                {/* Full name */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 italic uppercase tracking-tight break-words leading-tight">
                    {profile.displayName}
                  </h1>
                  <CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                </div>

                {/* Current job title + company */}
                {identity.jobTitle && (
                  <div className="mb-2">
                    <p className="text-[15px] font-bold text-gray-800 leading-snug break-words">{identity.jobTitle}</p>
                    {identity.company && (
                      <p className="text-[13px] font-semibold text-blue-600 break-words mt-0.5">{identity.company}</p>
                    )}
                  </div>
                )}

                {/* Career status badge */}
                {identity.status && (
                  <span className="inline-block text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full mb-2">
                    {identity.status}
                  </span>
                )}

                {/* Location */}
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <MapPin size={11} className="shrink-0" />
                    <span>{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {about && (
              <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mb-5 break-words">
                {about.length > 300 ? about.substring(0, 300) + '…' : about}
              </p>
            )}

            {/* Bottom row: social + stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-gray-100">
              {/* Social links */}
              <div className="flex items-center gap-2">
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noreferrer"
                    className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                    <Linkedin size={14} />
                  </a>
                )}
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noreferrer"
                    className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors">
                    <Github size={14} />
                  </a>
                )}
                {socialLinks.website && (
                  <a href={socialLinks.website} target="_blank" rel="noreferrer"
                    className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                    <Globe size={14} />
                  </a>
                )}
                {profile.username && (
                  <span className="text-xs text-gray-400 font-medium ml-1">@{profile.username}</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 sm:gap-7">
                {[
                  { icon: <Eye size={12} />, label: 'Views', value: profile.viewCount ?? 0 },
                  { icon: <Download size={12} />, label: 'Downloads', value: profile.downloadCount ?? 0 },
                  { icon: <Users size={12} />, label: 'Connections', value: profile.connectionCount ?? 0 },
                  { icon: <Calendar size={12} />, label: 'Joined', value: memberSince },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1 text-gray-400 mb-0.5">{s.icon}<span className="text-[10px] font-semibold">{s.label}</span></div>
                    <span className="text-base font-black text-gray-900 leading-none">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* ── Main Resume Column ──────────────────────────────────────── */}
          <div className="md:col-span-8 space-y-5">

{/* About */}
            {about && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<Users size={14} />} title="About" />
                  <FormattedText text={about} className="text-sm text-gray-600 leading-[1.8]" />
                </div>
              </motion.div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<Briefcase size={14} />} title="Experience" />
                  <div className="relative">
                    {/* Timeline rail */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />
                    <div className="space-y-8">
                      {experiences.map((exp, i) => (
                        <div key={i} className="flex gap-5">
                          <div className="relative flex flex-col items-center shrink-0 pt-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-2 ring-blue-100 z-10" />
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                              <h3 className="font-black text-gray-900 text-[15px] leading-snug break-words">{exp.title}</h3>
                              <span className="text-[11px] text-gray-400 font-medium tabular-nums whitespace-nowrap shrink-0">{exp.dateRange}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[13px] font-bold text-blue-600 break-words">{exp.company}</span>
                              {exp.type && <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{exp.type}</span>}
                              {exp.location && (
                                <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400">
                                  <MapPin size={10} /> {exp.location}
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <FormattedText text={exp.description} className="text-[13px] text-gray-500 leading-[1.75]" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<Code2 size={14} />} title="Projects" />
                  <div className="space-y-7">
                    {projects.map((proj, i) => (
                      <div key={i} className={`${i < projects.length - 1 ? 'pb-7 border-b border-gray-100' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-sm font-black shrink-0 mt-0.5">
                            {proj.title?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2 mb-1">
                              <h3 className="font-black text-gray-900 text-[15px] leading-snug break-words">{proj.title}</h3>
                              {proj.subtitle && (
                                <span className="text-[11px] text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{proj.subtitle}</span>
                              )}
                            </div>

                            {/* Links */}
                            {(proj.demoUrl || proj.githubUrl) && (
                              <div className="flex items-center gap-2 mb-3">
                                {proj.demoUrl && (
                                  <a href={proj.demoUrl} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                                    <ExternalLink size={10} /> Live Demo
                                  </a>
                                )}
                                {proj.githubUrl && (
                                  <a href={proj.githubUrl} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                                    <Github size={10} /> GitHub
                                  </a>
                                )}
                              </div>
                            )}

                            {proj.description && (
                              <FormattedText text={proj.description} className="text-[13px] text-gray-500 leading-[1.75] mb-3" />
                            )}

                            {proj.tech.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {proj.tech.map((t, j) => (
                                  <span key={j} className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg break-words">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<Award size={14} />} title="Certifications" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div className="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-[13px] font-black text-gray-700 shrink-0 shadow-sm">
                          {cert.issuer?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[13px] font-black text-gray-900 leading-snug break-words min-w-0">{cert.name}</h4>
                            <CheckCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-1 break-words">{cert.issuer}</p>
                          {cert.date && <p className="text-[11px] text-gray-400 mt-0.5">{cert.date}</p>}
                          {cert.url && (
                            <a href={cert.url} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-1.5 hover:underline">
                              <ExternalLink size={9} /> View Credential
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Publications */}
            {publications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<BookMarked size={14} />} title="Publications" />
                  <div className="space-y-5">
                    {publications.map((pub, i) => (
                      <div key={i} className={`${i < publications.length - 1 ? 'pb-5 border-b border-gray-100' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h3 className="font-black text-gray-900 text-[15px] leading-snug break-words">
                            {pub.url ? (
                              <a href={pub.url} target="_blank" rel="noreferrer"
                                className="hover:text-blue-600 transition-colors inline-flex items-baseline gap-1.5">
                                {pub.title} <ExternalLink size={11} className="shrink-0" />
                              </a>
                            ) : pub.title}
                          </h3>
                          {(pub.dateMonth || pub.dateYear) && (
                            <span className="text-[11px] text-gray-400 font-medium tabular-nums whitespace-nowrap shrink-0">
                              {[pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] font-bold text-blue-600 break-words">{pub.publisher}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<GraduationCap size={14} />} title="Education" />
                  <div className="space-y-6">
                    {profile.education.map((edu, i) => (
                      <div key={i} className={`${i < profile.education!.length - 1 ? 'pb-6 border-b border-gray-100' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h3 className="font-black text-gray-900 text-[15px] leading-snug break-words">{edu.degree}</h3>
                          <span className="text-[11px] text-gray-400 font-medium tabular-nums whitespace-nowrap shrink-0">
                            {edu.startYear} – {edu.current ? 'Present' : (edu.endYear || 'Present')}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-blue-600 mb-1 break-words">{edu.institution}</p>
                        {edu.department && <p className="text-xs text-gray-400 font-medium">{edu.department}</p>}
                        {edu.grade && <p className="text-xs text-gray-400 font-medium mt-0.5">CGPA: <span className="font-bold text-gray-600">{edu.grade}</span></p>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contact */}
            {(contact.email || contact.phone || profile.country) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-7">
                  <SectionHeader icon={<Mail size={14} />} title="Contact" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-gray-100 transition-colors group">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-blue-200">
                          <Mail size={13} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                          <p className="text-[13px] font-semibold text-gray-700 break-all">{contact.email}</p>
                        </div>
                      </a>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                          <Phone size={13} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p>
                          <p className="text-[13px] font-semibold text-gray-700 break-words">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    {profile.country && (
                      <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                          <MapPin size={13} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Location</p>
                          <p className="text-[13px] font-semibold text-gray-700 break-words">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {contact.website && (
                      <a href={contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-gray-100 transition-colors group">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-blue-200">
                          <Globe size={13} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Website</p>
                          <p className="text-[13px] font-semibold text-blue-600 break-all">{contact.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="md:col-span-4 space-y-4">

            {/* Public profile link */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={13} className="text-blue-600 shrink-0" />
                  <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wide">Public Profile</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-2">
                  <span className="text-[11px] font-semibold text-gray-600 flex-1 truncate">
                    cfound.in/{profile.username ?? username}
                  </span>
                  <button onClick={copyLink} className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors">
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">Share this link to let recruiters and collaborators find you.</p>
              </div>
            </motion.div>

            {/* Open to work */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}>
              <div className={`rounded-2xl border shadow-sm p-5 ${isOpenToWork ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${isOpenToWork ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <h3 className={`text-[12px] font-black uppercase tracking-wide ${isOpenToWork ? 'text-green-800' : 'text-gray-600'}`}>
                    {isOpenToWork ? 'Open to Opportunities' : 'Not Available'}
                  </h3>
                </div>
                <p className={`text-[11px] leading-relaxed ${isOpenToWork ? 'text-green-700' : 'text-gray-400'}`}>
                  {isOpenToWork ? 'Actively looking for new roles and projects.' : 'Not accepting new opportunities at this time.'}
                </p>
              </div>
            </motion.div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 size={13} className="text-blue-600 shrink-0" />
                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wide">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg break-words hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={13} className="text-blue-600 shrink-0" />
                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wide">Languages</h3>
                  </div>
                  <div className="space-y-3">
                    {profile.languages.map((lang, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-gray-800 break-words">{lang.name}</span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full break-words">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Edit own profile CTA */}
            {isOwnProfile && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                <div className="bg-blue-600 rounded-2xl p-5">
                  <p className="text-[11px] font-semibold text-blue-200 mb-3 leading-relaxed">This is how others see your profile. Make it shine.</p>
                  <Link
                    href="/profile"
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-600 rounded-xl px-4 py-2.5 text-[13px] font-black transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 border-t border-gray-100 mt-2">
          <p className="text-[11px] text-gray-400 font-medium">
            © {new Date().getFullYear()} C Found · Premier Indian Technology Studio ·{' '}
            <Link href="/" className="hover:text-blue-600 transition-colors">cfound.in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}