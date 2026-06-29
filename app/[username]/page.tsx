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
  Loader2, UserX, BookMarked, FileText, FileDown, X, LogIn,
  BadgeCheck, AtSign, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicProfile {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  careerStatus?: string;
  currentJobTitle?: string;
  currentCompany?: string;
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

const CAREER_STATUS_OPTIONS = [
  'Student', 'Fresher', 'Working Professional', 'Freelancer', 'Founder', 'Self Employed',
];

function getCareerStatus(p: PublicProfile): string {
  if (p.careerStatus) return p.careerStatus;
  if (p.secondaryRole && CAREER_STATUS_OPTIONS.includes(p.secondaryRole)) return p.secondaryRole;
  if (p.experienceLevel === 'fresher' || p.experienceLevel === 'entry') return 'Fresher';
  if (p.experienceLevel === 'student') return 'Student';
  return '';
}

interface CareerIdentity { jobTitle: string; company: string; status: string; }

function getCareerIdentity(p: PublicProfile): CareerIdentity {
  const status = getCareerStatus(p);
  if (p.currentJobTitle) return { jobTitle: p.currentJobTitle, company: p.currentCompany || '', status };
  const exps = getExperiences(p);
  const currentExp = exps.find(e => e.dateRange.includes('Present')) ?? exps[0];
  if (currentExp) {
    const suffix = status === 'Fresher' ? ' (Fresher)' : '';
    return { jobTitle: currentExp.title + suffix, company: currentExp.company, status };
  }
  const legacyTitle = p.primaryRole || p.currentRole || '';
  return { jobTitle: legacyTitle, company: '', status };
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

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
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
  function addPage() { doc.addPage(); y = 20; }
  function checkPage(needed = 10) { if (y + needed > 270) addPage(); }
  function hline(color = colors.border) {
    doc.setDrawColor(...color); doc.setLineWidth(0.3);
    doc.line(marginL, y, W - marginR, y); y += 4;
  }
  function sectionTitle(title: string) {
    checkPage(14); y += 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.accent);
    doc.text(title.toUpperCase(), marginL, y); y += 3; hline(colors.accent);
  }
  function wrapText(text: string, x: number, startY: number, maxW: number, fontSize: number, color: [number,number,number], fontStyle = 'normal'): number {
    doc.setFont('helvetica', fontStyle); doc.setFontSize(fontSize); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      checkPage(fontSize * 0.5 + 2);
      doc.text(line, x, startY === -1 ? y : startY);
      if (startY === -1) y += fontSize * 0.45 + 1;
      else startY += fontSize * 0.45 + 1;
    }
    return startY === -1 ? y : startY;
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...colors.heading);
  doc.text(profile.displayName || 'Professional Resume', marginL, y); y += 8;
  const pdfIdentity = getCareerIdentity(profile);
  const pdfTitle = [pdfIdentity.jobTitle, pdfIdentity.company].filter(Boolean).join(' · ') || pdfIdentity.status || '';
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...colors.accent);
  if (pdfTitle) { doc.text(pdfTitle, marginL, y); } y += 6;
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.city || profile.country) contactParts.push([profile.city, profile.country].filter(Boolean).join(', '));
  if (profile.portfolioUrl) contactParts.push(profile.portfolioUrl.replace(/^https?:\/\//, ''));
  if (contactParts.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
    doc.text(contactParts.join('  ·  '), marginL, y); y += 5;
  }
  const socialParts: string[] = [];
  if (profile.linkedinUrl) socialParts.push(profile.linkedinUrl.replace(/^https?:\/\//, ''));
  if (profile.githubUrl) socialParts.push(profile.githubUrl.replace(/^https?:\/\//, ''));
  if (socialParts.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
    doc.text(socialParts.join('  ·  '), marginL, y); y += 5;
  }
  hline();
  const about = getAbout(profile);
  if (about) {
    sectionTitle('Summary');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...colors.text);
    const aboutLines = doc.splitTextToSize(about.substring(0, 800), contentW);
    for (const line of aboutLines) { checkPage(6); doc.text(line, marginL, y); y += 4.5; }
    y += 2;
  }
  const experiences = getExperiences(profile);
  if (experiences.length) {
    sectionTitle('Experience');
    for (const exp of experiences) {
      checkPage(16);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...colors.heading);
      doc.text(exp.title, marginL, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
      const dateW = doc.getTextWidth(exp.dateRange);
      doc.text(exp.dateRange, W - marginR - dateW, y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.accent);
      doc.text(exp.company, marginL, y);
      if (exp.location) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.muted);
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
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...colors.text);
          for (const wl of wrapped) { checkPage(5); doc.text(wl, marginL + (isBullet ? 4 : 0), y); y += 4.5; }
        }
      }
      y += 4;
    }
  }
  if (profile.education?.length) {
    sectionTitle('Education');
    for (const edu of profile.education) {
      checkPage(14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...colors.heading);
      doc.text(edu.degree, marginL, y);
      const dateStr = `${edu.startYear} – ${edu.current ? 'Present' : (edu.endYear || 'Present')}`;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
      doc.text(dateStr, W - marginR - doc.getTextWidth(dateStr), y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.accent);
      doc.text(edu.institution, marginL, y);
      if (edu.grade) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.muted);
        doc.text(`  ·  CGPA: ${edu.grade}`, marginL + doc.getTextWidth(edu.institution), y);
      }
      y += 8;
    }
  }
  if (profile.skills?.length) {
    sectionTitle('Skills');
    const skillsText = profile.skills.join('  ·  ');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...colors.text);
    const skillLines = doc.splitTextToSize(skillsText, contentW);
    for (const line of skillLines) { checkPage(5); doc.text(line, marginL, y); y += 4.5; }
    y += 3;
  }
  const projects = getProjects(profile);
  if (projects.length) {
    sectionTitle('Projects');
    for (const proj of projects) {
      checkPage(14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...colors.heading);
      doc.text(proj.title, marginL, y);
      if (proj.subtitle) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
        doc.text(` · ${proj.subtitle}`, marginL + doc.getTextWidth(proj.title) + 1, y);
      }
      y += 5;
      if (proj.tech.length) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.accent);
        doc.text(proj.tech.join(', '), marginL, y); y += 5;
      }
      if (proj.description) {
        const descLines = doc.splitTextToSize(proj.description.substring(0, 400), contentW);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...colors.text);
        for (const dl of descLines) { checkPage(5); doc.text(dl, marginL, y); y += 4.5; }
      }
      y += 4;
    }
  }
  const certifications = getCertifications(profile);
  if (certifications.length) {
    sectionTitle('Certifications');
    for (const cert of certifications) {
      checkPage(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...colors.heading);
      doc.text(cert.name, marginL, y); y += 4.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
      doc.text([cert.issuer, cert.date].filter(Boolean).join(' · '), marginL, y); y += 7;
    }
  }
  const publications = profile.publications || [];
  if (publications.length) {
    sectionTitle('Publications');
    for (const pub of publications) {
      checkPage(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...colors.heading);
      const pubLines = doc.splitTextToSize(pub.title, contentW - 30);
      for (const pl of pubLines) { doc.text(pl, marginL, y); y += 4.5; }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...colors.muted);
      const pubMeta = [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
      doc.text(pubMeta, marginL, y); y += 7;
    }
  }
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...colors.muted);
    const footerText = `Generated via C Found · cfound.in/${profile.username || profile.uid}`;
    doc.text(footerText, marginL, 287);
    doc.text(`${i} / ${pageCount}`, W - marginR - doc.getTextWidth(`${i} / ${pageCount}`), 287);
  }
  doc.save(`${(profile.displayName || 'resume').replace(/\s+/g, '_')}_Resume.pdf`);
}

async function generateResumeDOCX(profile: PublicProfile): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, TabStopPosition, TabStopType, BorderStyle } = await import('docx');
  const experiences = getExperiences(profile);
  const certifications = getCertifications(profile);
  const projects = getProjects(profile);
  const about = getAbout(profile);
  function makeDivider() {
    return new Paragraph({ border: { bottom: { color: '2563EB', style: BorderStyle.SINGLE, size: 4 } }, spacing: { after: 80 } });
  }
  function sectionHeading(text: string) {
    return [
      new Paragraph({ spacing: { before: 200, after: 40 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: '2563EB', font: 'Calibri' })] }),
      makeDivider(),
    ];
  }
  const children: any[] = [];
  children.push(
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: profile.displayName || 'Professional Resume', bold: true, size: 48, font: 'Calibri', color: '0F172A' })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: (() => { const id = getCareerIdentity(profile); return [id.jobTitle, id.company].filter(Boolean).join(' · ') || id.status || ''; })(), size: 22, color: '2563EB', font: 'Calibri' })] }),
  );
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.city || profile.country) contactParts.push([profile.city, profile.country].filter(Boolean).join(', '));
  if (profile.portfolioUrl) contactParts.push(profile.portfolioUrl.replace(/^https?:\/\//, ''));
  if (contactParts.length) children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: contactParts.join('  ·  '), size: 18, color: '6B7280', font: 'Calibri' })] }));
  const socialParts: string[] = [];
  if (profile.linkedinUrl) socialParts.push(profile.linkedinUrl.replace(/^https?:\/\//, ''));
  if (profile.githubUrl) socialParts.push(profile.githubUrl.replace(/^https?:\/\//, ''));
  if (socialParts.length) children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: socialParts.join('  ·  '), size: 18, color: '6B7280', font: 'Calibri' })] }));
  if (about) {
    children.push(...sectionHeading('Summary'));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: about, size: 20, font: 'Calibri', color: '374151' })] }));
  }
  if (experiences.length) {
    children.push(...sectionHeading('Experience'));
    for (const exp of experiences) {
      children.push(
        new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: exp.title, bold: true, size: 22, font: 'Calibri', color: '0F172A' }), new TextRun({ text: '\t' + exp.dateRange, size: 18, color: '6B7280', font: 'Calibri' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: exp.company, bold: true, size: 18, color: '2563EB', font: 'Calibri' })] }),
      );
      if (exp.description) {
        const lines = exp.description.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const clean = line.replace(/^[\s]*[-*•]\s+/, '');
          const isBullet = /^[\s]*[-*•]\s+/.test(line);
          children.push(new Paragraph({ spacing: { after: 40 }, bullet: isBullet ? { level: 0 } : undefined, children: [new TextRun({ text: clean, size: 19, font: 'Calibri', color: '374151' })] }));
        }
      }
      children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    }
  }
  if (profile.education?.length) {
    children.push(...sectionHeading('Education'));
    for (const edu of profile.education) {
      children.push(
        new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: edu.degree, bold: true, size: 22, font: 'Calibri', color: '0F172A' }), new TextRun({ text: `\t${edu.startYear} – ${edu.current ? 'Present' : (edu.endYear || 'Present')}`, size: 18, color: '6B7280', font: 'Calibri' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: edu.institution, bold: true, size: 18, color: '2563EB', font: 'Calibri' }), ...(edu.grade ? [new TextRun({ text: `  ·  CGPA: ${edu.grade}`, size: 18, color: '6B7280', font: 'Calibri' })] : [])] }),
      );
    }
  }
  if (profile.skills?.length) {
    children.push(...sectionHeading('Skills'));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: profile.skills.join('  ·  '), size: 19, font: 'Calibri', color: '374151' })] }));
  }
  if (projects.length) {
    children.push(...sectionHeading('Projects'));
    for (const proj of projects) {
      children.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: proj.title, bold: true, size: 22, font: 'Calibri', color: '0F172A' })] }));
      if (proj.tech.length) children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: proj.tech.join(', '), size: 18, color: '2563EB', font: 'Calibri' })] }));
      if (proj.description) children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: proj.description, size: 19, font: 'Calibri', color: '374151' })] }));
      children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    }
  }
  if (certifications.length) {
    children.push(...sectionHeading('Certifications'));
    for (const cert of certifications) {
      children.push(
        new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: 'Calibri', color: '0F172A' })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: [cert.issuer, cert.date].filter(Boolean).join(' · '), size: 18, color: '6B7280', font: 'Calibri' })] }),
      );
    }
  }
  const pubs = profile.publications || [];
  if (pubs.length) {
    children.push(...sectionHeading('Publications'));
    for (const pub of pubs) {
      children.push(
        new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: pub.title, bold: true, size: 20, font: 'Calibri', color: '0F172A' })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join(' · '), size: 18, color: '6B7280', font: 'Calibri' })] }),
      );
    }
  }
  const docx = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } }, children }] });
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
                <li key={j} className="break-words text-gray-500">{line.replace(/^[\s]*[-*•]\s+/, '')}</li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="whitespace-pre-line break-words">{block.trim()}</p>;
      })}
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
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
            <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 text-sm font-bold transition-colors" onClick={onClose}>
              <LogIn size={15} /> Log In
            </Link>
            <Link href="/signup" className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-bold transition-colors" onClick={onClose}>
              Create Account
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Section Header (matches private profile style) ───────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">{icon}</div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  );
}

// ─── Social link bar (matches private profile style) ─────────────────────────

function SocialBar({ profile }: { profile: PublicProfile }) {
  const links = [
    { label: 'Portfolio', icon: <GlobeIcon />, href: profile.portfolioUrl },
    { label: 'GitHub',    icon: <GithubIcon />, href: profile.githubUrl },
    { label: 'LinkedIn',  icon: <LinkedinIcon />, href: profile.linkedinUrl },
  ].filter(l => l.href);

  if (!links.length) return null;

  return (
    <div className="inline-flex items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {links.map((item, idx) => (
        <React.Fragment key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-2 px-5 py-3.5 min-w-[80px] hover:bg-gray-50 transition-colors group"
          >
            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-white group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 whitespace-nowrap">{item.label}</span>
          </a>
          {idx < links.length - 1 && <div className="w-px bg-gray-100 self-stretch my-3 flex-shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="1.8"/>
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#3B82F6" strokeWidth="1.8"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#3B82F6" strokeWidth="1.8"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a1a1a" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// ─── Stat chip (matching private page's stat pills) ───────────────────────────

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
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

  useEffect(() => { if (username) fetchProfile(); }, [username]);

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
          if (ownerSnap.exists()) { data = { uid: ownerSnap.id, ...ownerSnap.data() } as PublicProfile; resolvedDocId = ownerSnap.id; }
        }
      }
      if (!data) {
        const docRef = doc(db, 'users', username);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { data = { uid: docSnap.id, ...docSnap.data() } as PublicProfile; resolvedDocId = docSnap.id; }
      }
      if (!data || !resolvedDocId) { setNotFound(true); return; }
      setProfile(data);
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
    if (format === 'docx' && !isOwnProfile) {
      if (!user) { setShowLoginModal(true); return; }
      toast.error('Only the profile owner can download DOCX.');
      return;
    }
    setIsDownloading(true);
    try {
      if (format === 'pdf') {
        await generateResumePDF(profile);
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
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-md"
          >
            <Loader2 size={24} className="text-white animate-spin" />
          </motion.div>
          <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Loading profile</p>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-5">
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

  const heroPhoto =
    profile.photoURL
      ? `${profile.photoURL}${profile.photoURL.includes('?') ? '&' : '?'}tr=w-800,h-800,c-at_max,q-100,f-auto`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'U')}&background=0052CC&color=fff&size=800`;

  // ── Profile Page ─────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f5f6fa] min-h-screen pb-20">

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/">
            <span className="text-base font-black text-blue-600 italic uppercase tracking-tight">C Found</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Share2 size={13} />}
              <span className="hidden sm:inline">Share</span>
            </button>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-5">

        {/* ── Hero Card (matches private profile hero style) ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Decorative radial blob — same as private profile */}
          <div
            className="pointer-events-none absolute -bottom-16 -right-16 w-[260px] h-[200px] lg:w-[420px] lg:h-[320px] rounded-full opacity-60"
            style={{ background: 'radial-gradient(ellipse at 60% 60%, #c4b5f4 0%, #a78bfa 30%, #818cf8 60%, transparent 80%)', filter: 'blur(2px)' }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-indigo-50/40" />

          {/* Open to work badge */}
          {isOpenToWork && (
            <div className="absolute top-5 right-5 z-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Open to Work
              </span>
            </div>
          )}

          {/* Hero content */}
          <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start px-4 sm:px-6 lg:px-8 py-8 lg:py-10 text-center lg:text-left">

            {/* Avatar — same size/radius as private profile */}
            <div className="flex-shrink-0 relative">
              <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] lg:w-[220px] lg:h-[220px] overflow-hidden rounded-[20px] lg:rounded-[24px] bg-blue-900 border-4 border-white shadow-md">
                <img
                  src={heroPhoto}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                <ShieldCheck size={13} className="text-white" />
              </div>
              {isOpenToWork && (
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              )}
            </div>

            {/* Info block */}
            <div className="flex-1 min-w-0 w-full pt-0 lg:pt-2">

              {/* Name */}
              <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl lg:text-[44px] leading-tight font-black text-gray-900 tracking-tight break-words italic uppercase">
                  {profile.displayName}
                </h1>
                <BadgeCheck size={22} className="lg:w-[26px] lg:h-[26px] text-blue-500 fill-blue-100 flex-shrink-0 mt-1" />
              </div>

              {/* @username */}
              {profile.username && (
                <button
                  onClick={copyLink}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors group"
                >
                  <AtSign size={13} className="text-gray-400 group-hover:text-blue-500" />
                  {profile.username}
                  {copied
                    ? <Check size={13} className="text-green-500" />
                    : <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                </button>
              )}

              {/* Job title + company */}
              <div className="mt-3 flex flex-col items-center lg:items-start">
                {identity.jobTitle && (
                  <h2 className="text-lg lg:text-xl font-bold text-blue-600 break-words">{identity.jobTitle}</h2>
                )}
                {identity.company && (
                  <p className="text-base font-semibold text-gray-500 mt-0.5 break-words">{identity.company}</p>
                )}
                {identity.status && (
                  <p className="text-sm font-semibold text-gray-400 mt-0.5">{identity.status}</p>
                )}
              </div>

              {/* Meta row — location + experienceLevel */}
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-x-3 gap-y-2 flex-wrap">
                {(profile.city || profile.country) && (
                  <>
                    <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                    </span>
                    <span className="text-gray-200 hidden sm:inline">|</span>
                  </>
                )}
                {profile.experienceLevel && (
                  <>
                    <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                      <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                      {profile.experienceLevel}
                    </span>
                  </>
                )}
              </div>

              {/* Social bar */}
              <div className="mt-6 flex justify-center lg:justify-start">
                <SocialBar profile={profile} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Bar (matches private profile stats bar) ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <StatChip icon={<Eye size={17} />} label="Views" value={profile.viewCount ?? 0} />
          <StatChip icon={<Download size={17} />} label="Downloads" value={profile.downloadCount ?? 0} />
          <StatChip icon={<Users size={17} />} label="Connections" value={profile.connectionCount ?? 0} />
          <StatChip icon={<Calendar size={17} />} label="Joined" value={memberSince} />
        </motion.div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

          {/* ── Main Column ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* About */}
            {about && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<Users size={18} />} title="About Me" />
                  <FormattedText text={about} className="text-[15px] text-gray-600 leading-7" />
                </div>
              </motion.div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<Briefcase size={18} />} title="Experience" />
                  <div className="relative">
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
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<Layers size={18} />} title="Projects" />
                  <div className="space-y-7">
                    {projects.map((proj, i) => (
                      <div key={i} className={i < projects.length - 1 ? 'pb-7 border-b border-gray-100' : ''}>
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
                                  <span key={j} className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{t}</span>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<Award size={18} />} title="Certifications" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div className="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-[13px] font-black text-gray-700 shrink-0 shadow-sm">
                          {cert.issuer?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[13px] font-black text-gray-900 leading-snug break-words">{cert.name}</h4>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<BookMarked size={18} />} title="Publications" />
                  <div className="space-y-5">
                    {publications.map((pub, i) => (
                      <div key={i} className={i < publications.length - 1 ? 'pb-5 border-b border-gray-100' : ''}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h3 className="font-black text-gray-900 text-[15px] leading-snug break-words">
                            {pub.url
                              ? <a href={pub.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors inline-flex items-baseline gap-1.5">{pub.title} <ExternalLink size={11} /></a>
                              : pub.title
                            }
                          </h3>
                          {(pub.dateMonth || pub.dateYear) && (
                            <span className="text-[11px] text-gray-400 font-medium tabular-nums whitespace-nowrap shrink-0">
                              {[pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] font-bold text-blue-600">{pub.publisher}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<GraduationCap size={18} />} title="Education" />
                  <div className="space-y-6">
                    {profile.education.map((edu, i) => (
                      <div key={i} className={i < profile.education!.length - 1 ? 'pb-6 border-b border-gray-100' : ''}>
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
            {(profile.email || profile.phone || profile.country || profile.portfolioUrl) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-7">
                  <SectionHeader icon={<Mail size={18} />} title="Contact" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-gray-100 transition-colors group">
                        <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-blue-200">
                          <Mail size={14} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                          <p className="text-[13px] font-semibold text-gray-700 break-all">{profile.email}</p>
                        </div>
                      </a>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                          <Phone size={14} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p>
                          <p className="text-[13px] font-semibold text-gray-700">{profile.phone}</p>
                        </div>
                      </div>
                    )}
                    {profile.country && (
                      <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                          <MapPin size={14} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Location</p>
                          <p className="text-[13px] font-semibold text-gray-700">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {profile.portfolioUrl && (
                      <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-gray-100 transition-colors group">
                        <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-blue-200">
                          <Globe size={14} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Website</p>
                          <p className="text-[13px] font-semibold text-blue-600 break-all">{profile.portfolioUrl.replace(/^https?:\/\//, '')}</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Public profile link */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe size={15} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Public Profile</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-2">
                  <span className="text-[11px] font-semibold text-gray-600 flex-1 truncate">
                    cfound.in/{profile.username ?? username}
                  </span>
                  <button onClick={copyLink} className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors">
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">Share this link with recruiters and collaborators.</p>
              </div>
            </motion.div>

            {/* Open to work */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}>
              <div className={`rounded-2xl border shadow-sm p-5 ${isOpenToWork ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpenToWork ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <span className={`w-3 h-3 rounded-full ${isOpenToWork ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  </div>
                  <h3 className={`text-sm font-bold ${isOpenToWork ? 'text-green-800' : 'text-gray-600'}`}>
                    {isOpenToWork ? 'Open to Opportunities' : 'Not Available'}
                  </h3>
                </div>
                <p className={`text-[11px] leading-relaxed pl-12 ${isOpenToWork ? 'text-green-700' : 'text-gray-400'}`}>
                  {isOpenToWork ? 'Actively looking for new roles and projects.' : 'Not accepting new opportunities at this time.'}
                </p>
              </div>
            </motion.div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Code2 size={15} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="text-[11px] font-semibold bg-blue-50/60 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
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
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Globe size={15} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Languages</h3>
                  </div>
                  <div className="space-y-3">
                    {profile.languages.map((lang, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-gray-800">{lang.name}</span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{lang.level}</span>
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