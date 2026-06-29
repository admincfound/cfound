// resumeBuilder.ts — C Found Resume Engine v2.0
// Premium PDF + DOCX generator. No AI rewriting. Pure profile data.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileData {
  displayName?: string;
  primaryRole?: string;
  secondaryRole?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  skills?: string[];
  photoURL?: string;

  // Social / professional links
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  youtubeUrl?: string;
  mediumUrl?: string;
  devtoUrl?: string;
  hashnodeUrl?: string;
  stackoverflowUrl?: string;
  kaggleUrl?: string;
  leetcodeUrl?: string;
  researchgateUrl?: string;
  scholarUrl?: string;
  otherUrl?: string;

  experiences?: ExperienceItem[];
  projects?: ProjectItem[];
  education?: EducationItem[];
  certifications?: CertificationItem[];
  publications?: PublicationItem[];
  languages?: LanguageItem[];
  awards?: AwardItem[];
  volunteer?: VolunteerItem[];
  achievements?: AchievementItem[];
}

interface ExperienceItem {
  role?: string;
  company?: string;
  type?: string; // Full-time, Part-time, etc.
  mode?: string; // Remote, On-site, etc.
  location?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  current?: boolean;
  skills?: string;
  description?: string;
}

interface ProjectItem {
  title?: string;
  status?: string;
  category?: string;
  technologies?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  description?: string;
  demoUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  researchUrl?: string;
}

interface EducationItem {
  degree?: string;
  institution?: string;
  department?: string;
  startYear?: string;
  endYear?: string;
  current?: boolean;
  cgpa?: string;
  achievements?: string;
}

interface CertificationItem {
  name?: string;
  org?: string;
  issueMonth?: string;
  issueYear?: string;
  credentialId?: string;
  url?: string;
}

interface PublicationItem {
  title?: string;
  publisher?: string;
  dateMonth?: string;
  dateYear?: string;
  doi?: string;
  url?: string;
}

interface LanguageItem {
  language?: string;
  proficiency?: string;
}

interface AwardItem {
  title?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

interface VolunteerItem {
  role?: string;
  org?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  current?: boolean;
  description?: string;
}

interface AchievementItem {
  title?: string;
  description?: string;
  date?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function isImageKitPhoto(url?: string | null): boolean {
  if (!url) return false;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return false;
  return url.startsWith(endpoint);
}

function formatDateRange(
  startMonth?: string,
  startYear?: string,
  endMonth?: string,
  endYear?: string,
  current?: boolean
): string {
  const start = [startMonth, startYear].filter(Boolean).join(' ');
  const end = current ? 'Present' : [endMonth, endYear].filter(Boolean).join(' ');
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Map a URL to a short clickable label + clean display text */
function linkMeta(url: string): { label: string; short: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const map: Record<string, string> = {
      'linkedin.com': 'LinkedIn',
      'github.com': 'GitHub',
      'behance.net': 'Behance',
      'dribbble.com': 'Dribbble',
      'instagram.com': 'Instagram',
      'twitter.com': 'X (Twitter)',
      'x.com': 'X (Twitter)',
      'youtube.com': 'YouTube',
      'medium.com': 'Medium',
      'dev.to': 'Dev.to',
      'hashnode.com': 'Hashnode',
      'stackoverflow.com': 'Stack Overflow',
      'kaggle.com': 'Kaggle',
      'leetcode.com': 'LeetCode',
      'researchgate.net': 'ResearchGate',
      'scholar.google.com': 'Google Scholar',
    };
    for (const [domain, label] of Object.entries(map)) {
      if (host.includes(domain)) return { label, short: label };
    }
    // Fallback: use hostname
    return { label: host, short: host };
  } catch {
    return { label: 'Link', short: 'Link' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Generator — C Found Premium v2
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePDF(data: ProfileData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  // Page dimensions
  const W = 210;   // A4 width  (mm)
  const H = 297;   // A4 height (mm)
  const ML = 18;   // left margin
  const MR = 18;   // right margin
  const CW = W - ML - MR;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Design tokens ──────────────────────────────────────────────────────────
  const C = {
    blue:      [37,  99,  235] as [number,number,number], // #2563EB brand blue
    blueLight: [219,234,254]   as [number,number,number], // #DBEAFE chip bg
    dark:      [15,  23,  42]  as [number,number,number], // #0F172A near-black
    mid:       [71,  85, 105]  as [number,number,number], // #475569 slate
    muted:     [148,163,184]   as [number,number,number], // #94A3B8 muted
    divider:   [226,232,240]   as [number,number,number], // #E2E8F0
    headerBg:  [248,250,255]   as [number,number,number], // very light blue tint
    chipBg:    [241,245,249]   as [number,number,number], // #F1F5F9
    white:     [255,255,255]   as [number,number,number],
    green:     [22, 163,74]    as [number,number,number], // current badge
  };

  // State
  let y = 0;
  let currentPage = 1;

  // ── Core helpers ───────────────────────────────────────────────────────────

  const rgb = (c: [number,number,number]) => ({ r: c[0], g: c[1], b: c[2] });

  const setColor   = (c: [number,number,number]) => doc.setTextColor(...c);
  const setFill    = (c: [number,number,number]) => doc.setFillColor(...c);
  const setDraw    = (c: [number,number,number]) => doc.setDrawColor(...c);
  const setLW      = (w: number)                 => doc.setLineWidth(w);

  const newPage = () => {
    doc.addPage();
    currentPage++;
    y = 20;
    addWatermark();
  };

  const needsPage = (h: number) => {
    if (y + h > H - 18) { newPage(); return true; }
    return false;
  };

  const hRule = (yy: number, color: [number,number,number] = C.divider, lw = 0.25) => {
    setDraw(color);
    setLW(lw);
    doc.line(ML, yy, W - MR, yy);
  };

  // ── Typography helpers ─────────────────────────────────────────────────────

  type Weight = 'normal' | 'bold' | 'italic';

  const font = (style: Weight = 'normal', size = 9) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const textW = (t: string) => doc.getTextWidth(t);

  // Clickable hyperlink text (ATS: real text + invisible link annotation)
  const hyperlink = (
    label: string,
    url: string,
    x: number,
    yy: number,
    color: [number,number,number] = C.blue,
    fontSize = 8
  ) => {
    font('normal', fontSize);
    setColor(color);
    doc.text(label, x, yy);
    const w = textW(label);
    doc.link(x, yy - fontSize * 0.35, w, fontSize * 0.4, { url });
    // Subtle underline
    setDraw(color);
    setLW(0.15);
    doc.line(x, yy + 0.5, x + w, yy + 0.5);
  };

  // ── Watermark (per-page) ───────────────────────────────────────────────────

  const addWatermark = () => {
    // Diagonal faint text
    doc.saveGraphicsState?.();
    doc.setGState?.(new (doc as any).GState({ opacity: 0.028 }));
    setColor(C.blue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.text('C FOUND', W / 2, H / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState?.();
  };

  // ── Section header ─────────────────────────────────────────────────────────

  const sectionHeader = (title: string, icon = '') => {
    needsPage(14);
    y += 8;
    // Left accent bar
    setFill(C.blue);
    doc.roundedRect(ML, y - 4, 2.5, 5.5, 0.5, 0.5, 'F');
    // Title text
    setColor(C.blue);
    font('bold', 8);
    doc.text((icon ? icon + '  ' : '') + title.toUpperCase(), ML + 5, y);
    y += 1.5;
    hRule(y, C.divider, 0.3);
    y += 5.5;
  };

  // ── Chip row (skills) ──────────────────────────────────────────────────────

  const drawChips = (items: string[]) => {
    const GAP_X = 3;
    const GAP_Y = 4.5;
    const PX = 4;
    const PY = 1.8;
    const RADIUS = 1.5;
    const FONT_SIZE = 7.5;
    font('normal', FONT_SIZE);
    let cx = ML;
    const LINE_H = FONT_SIZE * 0.352 + PY * 2 + GAP_Y;

    items.forEach((skill) => {
      const sw = textW(skill);
      const chipW = sw + PX * 2;
      if (cx + chipW > W - MR) {
        cx = ML;
        y += LINE_H - GAP_Y + GAP_Y;
        needsPage(LINE_H);
      }
      // Chip background
      setFill(C.chipBg);
      setDraw(C.divider);
      setLW(0.2);
      doc.roundedRect(cx, y - FONT_SIZE * 0.35 - PY, chipW, FONT_SIZE * 0.35 * 2 + PY * 2, RADIUS, RADIUS, 'FD');
      // Chip text
      setColor(C.mid);
      doc.text(skill, cx + PX, y);
      cx += chipW + GAP_X;
    });
    y += LINE_H;
  };

  // ── Experience block ───────────────────────────────────────────────────────

  const expBlock = (exp: ExperienceItem) => {
    // Estimate height to avoid splitting
    const descLines = exp.description
      ? doc.splitTextToSize(exp.description.trim(), CW - 8).length
      : 0;
    const blockH = 22 + descLines * 4.5;
    needsPage(blockH);

    // Role title
    font('bold', 10.5);
    setColor(C.dark);
    doc.text(exp.role || '', ML, y);

    // Current badge
    if (exp.current) {
      const badge = ' Current';
      const bx = ML + textW(exp.role || '') + 3;
      setFill(C.green);
      doc.roundedRect(bx, y - 3.2, textW(badge) + 4, 4.2, 1, 1, 'F');
      setColor(C.white);
      font('bold', 6.5);
      doc.text(badge, bx + 2, y);
    }
    y += 5.5;

    // Company · type
    font('normal', 8.5);
    setColor(C.mid);
    const companyStr = [exp.company, exp.type].filter(Boolean).join('  ·  ');
    doc.text(companyStr, ML, y);
    y += 4.5;

    // Date · location · mode
    font('italic', 7.5);
    setColor(C.muted);
    const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
    const locStr = [dateStr, exp.location, exp.mode].filter(Boolean).join('   ·   ');
    if (locStr) { doc.text(locStr, ML, y); y += 4.5; }

    // Skills used chips (inline text)
    if (exp.skills?.trim()) {
      font('normal', 7.5);
      setColor(C.blue);
      const skills = exp.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      doc.text('Skills:  ' + skills.join('  ·  '), ML, y);
      y += 4.5;
    }

    // Description — bullet lines
    if (exp.description?.trim()) {
      font('normal', 8.5);
      setColor(C.mid);
      const rawLines = exp.description.trim().split('\n').filter(Boolean);
      rawLines.forEach(raw => {
        const wrapped = doc.splitTextToSize(raw, CW - 8);
        wrapped.forEach((line: string, i: number) => {
          needsPage(5);
          doc.text((i === 0 ? '•  ' : '    ') + line, ML + 2, y);
          y += 4.5;
        });
      });
    }

    y += 3;
    hRule(y - 1.5, C.divider, 0.2);
    y += 3;
  };

  // ── Project card ───────────────────────────────────────────────────────────

  const projectCard = (proj: ProjectItem) => {
    const descLines = proj.description
      ? doc.splitTextToSize(proj.description.trim(), CW - 8).length
      : 0;
    needsPage(22 + descLines * 4.5);

    // Title + status badge
    font('bold', 10.5);
    setColor(C.dark);
    doc.text(proj.title || '', ML, y);
    if (proj.status) {
      const bx = W - MR - textW(proj.status) - 5;
      setFill(C.blueLight);
      doc.roundedRect(bx, y - 3.2, textW(proj.status) + 4, 4.2, 1, 1, 'F');
      setColor(C.blue);
      font('normal', 6.5);
      doc.text(proj.status, bx + 2, y);
    }
    y += 5.5;

    // Category · date
    font('italic', 7.5);
    setColor(C.muted);
    const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
    const projMeta = [proj.category, projDate].filter(Boolean).join('   ·   ');
    if (projMeta) { doc.text(projMeta, ML, y); y += 4.5; }

    // Tech stack
    if (proj.technologies?.trim()) {
      font('normal', 7.5);
      setColor(C.blue);
      doc.text('Stack:  ' + proj.technologies, ML, y);
      y += 4.5;
    }

    // Description
    if (proj.description?.trim()) {
      font('normal', 8.5);
      setColor(C.mid);
      const rawLines = proj.description.trim().split('\n').filter(Boolean);
      rawLines.forEach(raw => {
        const wrapped = doc.splitTextToSize(raw, CW - 8);
        wrapped.forEach((line: string, i: number) => {
          needsPage(5);
          doc.text((i === 0 ? '•  ' : '    ') + line, ML + 2, y);
          y += 4.5;
        });
      });
    }

    // Links
    const links: Array<{ label: string; url: string }> = [];
    if (proj.demoUrl)     links.push({ label: 'Live Demo', url: proj.demoUrl });
    if (proj.githubUrl)   links.push({ label: 'GitHub', url: proj.githubUrl });
    if (proj.websiteUrl)  links.push({ label: 'Website', url: proj.websiteUrl });
    if (proj.researchUrl) links.push({ label: 'Research', url: proj.researchUrl });
    if (links.length) {
      let lx = ML;
      links.forEach(({ label, url }, i) => {
        if (i > 0) {
          font('normal', 8);
          setColor(C.muted);
          doc.text('  ·  ', lx, y);
          lx += textW('  ·  ');
        }
        hyperlink(label, url, lx, y, C.blue, 8);
        lx += textW(label) + 2;
      });
      y += 5;
    }

    y += 3;
    hRule(y - 1.5, C.divider, 0.2);
    y += 3;
  };

  // ── Education card ─────────────────────────────────────────────────────────

  const educationCard = (edu: EducationItem) => {
    needsPage(20);
    font('bold', 10.5);
    setColor(C.dark);
    doc.text(edu.degree || '', ML, y);
    font('normal', 8.5);
    setColor(C.mid);
    doc.text(edu.institution || '', W - MR, y, { align: 'right' });
    y += 5.5;

    font('italic', 7.5);
    setColor(C.muted);
    const eduMeta = [
      edu.department,
      [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – '),
      edu.cgpa ? `CGPA: ${edu.cgpa}` : undefined,
    ].filter(Boolean).join('   ·   ');
    if (eduMeta) { doc.text(eduMeta, ML, y); y += 4.5; }

    if (edu.achievements?.trim()) {
      font('normal', 8);
      setColor(C.mid);
      const wrapped = doc.splitTextToSize(edu.achievements.trim(), CW - 5);
      wrapped.forEach((line: string) => {
        needsPage(5);
        doc.text(line, ML, y);
        y += 4.5;
      });
    }

    y += 3;
    hRule(y - 1.5, C.divider, 0.2);
    y += 3;
  };

  // ── Certification card ─────────────────────────────────────────────────────

  const certCard = (cert: CertificationItem) => {
    needsPage(18);
    font('bold', 9.5);
    setColor(C.dark);
    doc.text(cert.name || '', ML, y);
    font('normal', 8.5);
    setColor(C.mid);
    doc.text(cert.org || '', W - MR, y, { align: 'right' });
    y += 5;

    font('italic', 7.5);
    setColor(C.muted);
    const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
    const certMeta = [certDate, cert.credentialId ? `ID: ${cert.credentialId}` : undefined].filter(Boolean).join('   ·   ');
    if (certMeta) { doc.text(certMeta, ML, y); y += 4.5; }

    if (cert.url) {
      hyperlink('Verify Certificate →', cert.url, ML, y, C.blue, 8);
      y += 5;
    }

    y += 2;
    hRule(y - 1, C.divider, 0.2);
    y += 3;
  };

  // ── Publication block ──────────────────────────────────────────────────────

  const pubBlock = (pub: PublicationItem) => {
    needsPage(18);
    font('bold', 9.5);
    setColor(C.dark);
    const titleLines = doc.splitTextToSize(pub.title || '', CW);
    doc.text(titleLines, ML, y);
    y += titleLines.length * 5;

    font('italic', 7.5);
    setColor(C.muted);
    const pubMeta = [
      pub.publisher,
      [pub.dateMonth, pub.dateYear].filter(Boolean).join(' '),
      pub.doi ? `DOI: ${pub.doi}` : undefined,
    ].filter(Boolean).join('   ·   ');
    if (pubMeta) { doc.text(pubMeta, ML, y); y += 4.5; }

    if (pub.url) {
      hyperlink('Read Publication →', pub.url, ML, y, C.blue, 8);
      y += 5;
    }

    y += 2;
    hRule(y - 1, C.divider, 0.2);
    y += 3;
  };

  // ── Language chips ─────────────────────────────────────────────────────────

  const langChips = (langs: LanguageItem[]) => {
    langs.forEach(({ language, proficiency }) => {
      if (!language) return;
      const label = proficiency ? `${language}  (${proficiency})` : language;
      const chipW = textW(label) + 8;
      setFill(C.chipBg);
      setDraw(C.divider);
      setLW(0.2);
      doc.roundedRect(ML, y - 3.5, chipW, 5.5, 1.5, 1.5, 'FD');
      setColor(C.dark);
      font('normal', 8);
      doc.text(label, ML + 4, y);
      y += 7;
    });
  };

  // ── Award / Achievement card ───────────────────────────────────────────────

  const highlightCard = (title: string, sub?: string, desc?: string, date?: string) => {
    needsPage(16);
    // Accent left border
    setFill(C.blue);
    doc.rect(ML, y - 4, 1.5, desc ? 14 : 8, 'F');

    font('bold', 9.5);
    setColor(C.dark);
    doc.text(title, ML + 5, y);
    if (date) {
      font('normal', 7.5);
      setColor(C.muted);
      doc.text(date, W - MR, y, { align: 'right' });
    }
    y += 5;

    if (sub) {
      font('italic', 8);
      setColor(C.mid);
      doc.text(sub, ML + 5, y);
      y += 4.5;
    }

    if (desc) {
      font('normal', 8);
      setColor(C.mid);
      const wrapped = doc.splitTextToSize(desc.trim(), CW - 8);
      wrapped.forEach((line: string) => {
        needsPage(5);
        doc.text(line, ML + 5, y);
        y += 4.5;
      });
    }

    y += 4;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD THE DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Page 1 header background ───────────────────────────────────────────────
  setFill(C.headerBg);
  doc.rect(0, 0, W, 58, 'F');

  // Add watermark to page 1
  addWatermark();

  // ── Photo ──────────────────────────────────────────────────────────────────
  const usePhoto = isImageKitPhoto(data.photoURL);
  const PHOTO_SIZE = 30;
  let headerX = ML;
  let headerW = CW;

  y = 16;

  if (usePhoto) {
    try {
      const photoUrl = `${data.photoURL}?tr=w-240,h-240,c-at_max,f-jpg,q-95,fo-face`;
      const imgData = await fetchImageAsBase64(photoUrl);
      if (imgData) {
        // Circular clip via rounded rect (jsPDF approximation)
        const px = W - MR - PHOTO_SIZE;
        const py = 12;
        // Shadow ring
        setFill([220, 230, 255]);
        doc.roundedRect(px - 1, py - 1, PHOTO_SIZE + 2, PHOTO_SIZE + 2, 16, 16, 'F');
        // White ring
        setFill(C.white);
        doc.roundedRect(px - 0.5, py - 0.5, PHOTO_SIZE + 1, PHOTO_SIZE + 1, 15.5, 15.5, 'F');
        // Photo
        doc.addImage(imgData, 'JPEG', px, py, PHOTO_SIZE, PHOTO_SIZE, undefined, 'FAST');
        headerW = CW - PHOTO_SIZE - 8;
      }
    } catch { /* photo failed, skip */ }
  }

  // ── Name ───────────────────────────────────────────────────────────────────
  setColor(C.dark);
  font('bold', 22);
  doc.text(data.displayName || '', headerX, y);
  y += 7.5;

  // ── Role ───────────────────────────────────────────────────────────────────
  const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
  if (roleText) {
    setColor(C.blue);
    font('bold', 10);
    doc.text(roleText, headerX, y);
    y += 5.5;
  }

  // ── Contact line ───────────────────────────────────────────────────────────
  const contactParts: string[] = [];
  if (data.email)   contactParts.push(data.email);
  if (data.phone)   contactParts.push(data.phone);
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
  if (loc) contactParts.push(loc);

  if (contactParts.length) {
    setColor(C.mid);
    font('normal', 8.5);
    // Email as hyperlink if present
    let cx = headerX;
    contactParts.forEach((part, i) => {
      if (i > 0) {
        setColor(C.muted);
        doc.text('   |   ', cx, y);
        cx += textW('   |   ');
      }
      if (part === data.email) {
        hyperlink(part, `mailto:${part}`, cx, y, C.dark, 8.5);
      } else if (part === data.phone) {
        hyperlink(part, `tel:${part}`, cx, y, C.dark, 8.5);
      } else {
        setColor(C.dark);
        font('normal', 8.5);
        doc.text(part, cx, y);
      }
      cx += textW(part);
    });
    y += 5;
  }

  // ── Professional links ─────────────────────────────────────────────────────
  const profileLinks: Array<{ label: string; url: string }> = [
    data.linkedinUrl   && { label: 'LinkedIn',       url: data.linkedinUrl },
    data.githubUrl     && { label: 'GitHub',         url: data.githubUrl },
    data.portfolioUrl  && { label: 'Portfolio',      url: data.portfolioUrl },
    data.twitterUrl    && { label: 'X (Twitter)',    url: data.twitterUrl },
    data.behanceUrl    && { label: 'Behance',        url: data.behanceUrl },
    data.dribbbleUrl   && { label: 'Dribbble',       url: data.dribbbleUrl },
    data.youtubeUrl    && { label: 'YouTube',        url: data.youtubeUrl },
    data.mediumUrl     && { label: 'Medium',         url: data.mediumUrl },
    data.kaggleUrl     && { label: 'Kaggle',         url: data.kaggleUrl },
    data.leetcodeUrl   && { label: 'LeetCode',       url: data.leetcodeUrl },
    data.scholarUrl    && { label: 'Google Scholar', url: data.scholarUrl },
    data.researchgateUrl && { label: 'ResearchGate', url: data.researchgateUrl },
    data.stackoverflowUrl && { label: 'Stack Overflow', url: data.stackoverflowUrl },
    data.otherUrl      && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (profileLinks.length) {
    let lx = headerX;
    profileLinks.forEach(({ label, url }, i) => {
      if (lx + textW(label) + 4 > headerX + headerW - 2) {
        y += 5;
        lx = headerX;
      }
      if (i > 0 && lx > headerX) {
        setColor(C.muted);
        font('normal', 8);
        doc.text('  ·  ', lx, y);
        lx += textW('  ·  ');
      }
      hyperlink(label, url, lx, y, C.blue, 8);
      lx += textW(label);
    });
    y += 6;
  }

  // ── Header bottom rule ────────────────────────────────────────────────────
  y = Math.max(y, 56);
  setDraw(C.blue);
  setLW(0.8);
  doc.line(ML, y, W - MR, y);
  y += 7;

  // ── About Me ───────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    sectionHeader('About Me');
    setColor(C.mid);
    font('normal', 9);
    const bioLines = doc.splitTextToSize(data.bio.trim(), CW);
    bioLines.forEach((line: string) => {
      needsPage(5);
      doc.text(line, ML, y);
      y += 5;
    });
    y += 2;
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    sectionHeader('Skills');
    drawChips(data.skills);
    y += 2;
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    sectionHeader('Experience');
    data.experiences.forEach(expBlock);
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    sectionHeader('Projects');
    data.projects.forEach(projectCard);
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sectionHeader('Education');
    data.education.forEach(educationCard);
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sectionHeader('Certifications');
    data.certifications.forEach(certCard);
  }

  // ── Publications ───────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    sectionHeader('Publications');
    data.publications.forEach(pubBlock);
  }

  // ── Languages ──────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    sectionHeader('Languages');
    langChips(data.languages);
    y += 2;
  }

  // ── Awards ─────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    sectionHeader('Awards & Honors');
    data.awards.forEach(a => highlightCard(a.title || '', a.issuer, a.description, a.date));
  }

  // ── Volunteer ──────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    sectionHeader('Volunteer Experience');
    data.volunteer.forEach(v => {
      const meta = formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current);
      highlightCard(v.role || '', [v.org, meta].filter(Boolean).join('  ·  '), v.description);
    });
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    sectionHeader('Achievements');
    data.achievements.forEach(a => highlightCard(a.title || '', undefined, a.description, a.date));
  }

  // ── Footer (all pages) ────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer rule
    hRule(H - 13, C.divider, 0.3);

    // Left: name · generated date
    setColor(C.muted);
    font('normal', 6.5);
    doc.text(`${data.displayName || ''}  ·  Generated ${today}`, ML, H - 9);

    // Center: C Found watermark text
    setColor(C.muted);
    font('normal', 6.5);
    doc.text('Powered by C Found  ·  cfound.app', W / 2, H - 9, { align: 'center' });

    // Right: page number
    setColor(C.muted);
    font('normal', 6.5);
    doc.text(`Page ${i} of ${totalPages}`, W - MR, H - 9, { align: 'right' });
  }

  doc.save(`${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume_CFoud.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX Generator — C Found Premium v2
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDOCX(data: ProfileData): Promise<void> {
  const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  VerticalAlign,
  ExternalHyperlink,
} = await import("docx");

  // ── Color palette ──────────────────────────────────────────────────────────
  const HEX = {
    blue:   '2563EB',
    dark:   '0F172A',
    mid:    '475569',
    muted:  '94A3B8',
    divider:'E2E8F0',
    green:  '16A34A',
    chip:   'F1F5F9',
  };

  const FONT = 'Calibri';

  // ── Helper factory ─────────────────────────────────────────────────────────

  const run = (text: string, opts: {
    bold?: boolean; italic?: boolean; size?: number;
    color?: string; font?: string; underline?: boolean;
  } = {}) =>
    new TextRun({
      text,
      bold: opts.bold ?? false,
      italics: opts.italic ?? false,
      size: opts.size ?? 20,
      color: opts.color ?? HEX.dark,
      font: opts.font ?? FONT,
      underline: opts.underline ? {} : undefined,
    });

  const link = (label: string, url: string) =>
    new ExternalHyperlink({
      link: url,
      children: [run(label, { color: HEX.blue, underline: true, size: 18 })],
    });

  const para = (children: any[], opts: {
    before?: number; after?: number; indent?: number; align?: typeof AlignmentType[keyof typeof AlignmentType];
    border?: boolean;
  } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 40 },
      indent: opts.indent ? { left: opts.indent } : undefined,
      border: opts.border ? {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: HEX.divider, space: 1 },
      } : undefined,
      children,
    });

  const hRule = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: HEX.divider, space: 1 } },
      spacing: { before: 80, after: 80 },
      children: [],
    });

  const thickRule = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: HEX.blue, space: 1 } },
      spacing: { before: 80, after: 80 },
      children: [],
    });

  const gap = (sz = 60) => new Paragraph({ spacing: { before: sz, after: 0 }, children: [] });

  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 280, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: HEX.blue, space: 2 },
      },
      children: [
        run(title.toUpperCase(), { bold: true, size: 18, color: HEX.blue }),
      ],
    });

  // ── Build content ──────────────────────────────────────────────────────────
  const children: any[] = [];

  // ── NAME ──────────────────────────────────────────────────────────────────
  children.push(
    para([run(data.displayName || '', { bold: true, size: 48, color: HEX.dark })], { after: 60 })
  );

  // ── Role ──────────────────────────────────────────────────────────────────
  const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
  if (roleText) {
    children.push(para([run(roleText, { bold: true, size: 22, color: HEX.blue })], { after: 60 }));
  }

  // ── Contact ───────────────────────────────────────────────────────────────
  const contactParts: any[] = [];
  if (data.email) contactParts.push(link(data.email, `mailto:${data.email}`));
  if (data.phone) {
    if (contactParts.length) contactParts.push(run('   |   ', { color: HEX.muted, size: 18 }));
    contactParts.push(link(data.phone, `tel:${data.phone}`));
  }
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
  if (loc) {
    if (contactParts.length) contactParts.push(run('   |   ', { color: HEX.muted, size: 18 }));
    contactParts.push(run(loc, { color: HEX.mid, size: 18 }));
  }
  if (contactParts.length) {
    children.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: contactParts }));
  }

  // ── Professional links ─────────────────────────────────────────────────────
  const profLinks: Array<{ label: string; url: string }> = [
    data.linkedinUrl   && { label: 'LinkedIn',        url: data.linkedinUrl },
    data.githubUrl     && { label: 'GitHub',          url: data.githubUrl },
    data.portfolioUrl  && { label: 'Portfolio',       url: data.portfolioUrl },
    data.twitterUrl    && { label: 'X (Twitter)',     url: data.twitterUrl },
    data.behanceUrl    && { label: 'Behance',         url: data.behanceUrl },
    data.dribbbleUrl   && { label: 'Dribbble',        url: data.dribbbleUrl },
    data.youtubeUrl    && { label: 'YouTube',         url: data.youtubeUrl },
    data.mediumUrl     && { label: 'Medium',          url: data.mediumUrl },
    data.kaggleUrl     && { label: 'Kaggle',          url: data.kaggleUrl },
    data.researchgateUrl && { label: 'ResearchGate', url: data.researchgateUrl },
    data.scholarUrl    && { label: 'Google Scholar',  url: data.scholarUrl },
    data.otherUrl      && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (profLinks.length) {
    const linkChildren: any[] = [];
    profLinks.forEach(({ label, url }, i) => {
      if (i > 0) linkChildren.push(run('   ·   ', { color: HEX.muted, size: 17 }));
      linkChildren.push(link(label, url));
    });
    children.push(new Paragraph({ spacing: { before: 0, after: 80 }, children: linkChildren }));
  }

  children.push(thickRule());

  // ── About ──────────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    children.push(sectionTitle('About Me'));
    data.bio.trim().split('\n').filter(Boolean).forEach(line => {
      children.push(para([run(line, { color: HEX.mid, size: 20 })], { before: 20, after: 20 }));
    });
    children.push(gap(60));
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    children.push(sectionTitle('Skills'));
    // Render as pill-text approximation
    children.push(
      para([run(data.skills.join('   ·   '), { color: HEX.mid, size: 19 })], { after: 60 })
    );
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    children.push(sectionTitle('Experience'));
    data.experiences.forEach((exp: ExperienceItem) => {
      // Role + current badge
      const roleRuns: any[] = [run(exp.role || '', { bold: true, size: 22, color: HEX.dark })];
      if (exp.current) roleRuns.push(run('  [ Current ]', { bold: true, size: 16, color: HEX.green }));
      children.push(new Paragraph({ spacing: { before: 120, after: 20 }, children: roleRuns }));

      // Company
      const companyStr = [exp.company, exp.type].filter(Boolean).join('  ·  ');
      children.push(para([run(companyStr, { size: 19, color: HEX.mid })], { before: 0, after: 20 }));

      // Date / location
      const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      const locStr = [dateStr, exp.location, exp.mode].filter(Boolean).join('   ·   ');
      if (locStr) children.push(para([run(locStr, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));

      // Skills
      if (exp.skills?.trim()) {
        children.push(para([
          run('Skills: ', { bold: true, size: 17, color: HEX.blue }),
          run(exp.skills, { size: 17, color: HEX.blue }),
        ], { after: 20 }));
      }

      // Description
      if (exp.description?.trim()) {
        exp.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], {
            before: 10, after: 10, indent: 200,
          }));
        });
      }

      children.push(hRule());
    });
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    children.push(sectionTitle('Projects'));
    data.projects.forEach((proj: ProjectItem) => {
      const titleRuns: any[] = [run(proj.title || '', { bold: true, size: 22, color: HEX.dark })];
      if (proj.status) titleRuns.push(run(`   [ ${proj.status} ]`, { size: 17, color: HEX.blue }));
      children.push(new Paragraph({ spacing: { before: 120, after: 20 }, children: titleRuns }));

      const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      const projMeta = [proj.category, projDate].filter(Boolean).join('   ·   ');
      if (projMeta) children.push(para([run(projMeta, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));

      if (proj.technologies?.trim()) {
        children.push(para([
          run('Stack: ', { bold: true, size: 17, color: HEX.blue }),
          run(proj.technologies, { size: 17, color: HEX.blue }),
        ], { after: 20 }));
      }

      if (proj.description?.trim()) {
        proj.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], {
            before: 10, after: 10, indent: 200,
          }));
        });
      }

      const linkRuns: any[] = [];
      if (proj.demoUrl)    { linkRuns.push(link('Live Demo', proj.demoUrl)); }
      if (proj.githubUrl)  { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('GitHub', proj.githubUrl)); }
      if (proj.websiteUrl) { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('Website', proj.websiteUrl)); }
      if (proj.researchUrl){ if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('Research', proj.researchUrl)); }
      if (linkRuns.length) children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: linkRuns }));

      children.push(hRule());
    });
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    children.push(sectionTitle('Education'));
    data.education.forEach((edu: EducationItem) => {
      children.push(new Paragraph({
        spacing: { before: 120, after: 20 },
        children: [
          run(edu.degree || '', { bold: true, size: 22, color: HEX.dark }),
          run('    ' + (edu.institution || ''), { size: 19, color: HEX.mid }),
        ],
      }));
      const eduMeta = [
        edu.department,
        [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – '),
        edu.cgpa ? `CGPA: ${edu.cgpa}` : undefined,
      ].filter(Boolean).join('   ·   ');
      if (eduMeta) children.push(para([run(eduMeta, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      if (edu.achievements?.trim()) {
        children.push(para([run(edu.achievements.trim(), { size: 18, color: HEX.mid })], { after: 20 }));
      }
      children.push(hRule());
    });
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    children.push(sectionTitle('Certifications'));
    data.certifications.forEach((cert: CertificationItem) => {
      children.push(new Paragraph({
        spacing: { before: 100, after: 20 },
        children: [
          run(cert.name || '', { bold: true, size: 20, color: HEX.dark }),
          run('    ' + (cert.org || ''), { size: 18, color: HEX.mid }),
        ],
      }));
      const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
      const certMeta = [certDate, cert.credentialId ? `ID: ${cert.credentialId}` : undefined].filter(Boolean).join('   ·   ');
      if (certMeta) children.push(para([run(certMeta, { italic: true, size: 16, color: HEX.muted })], { after: 20 }));
      if (cert.url) children.push(new Paragraph({ spacing: { before: 10, after: 20 }, children: [link('Verify Certificate →', cert.url)] }));
      children.push(hRule());
    });
  }

  // ── Publications ───────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    children.push(sectionTitle('Publications'));
    data.publications.forEach((pub: PublicationItem) => {
      children.push(para([run(pub.title || '', { bold: true, size: 20, color: HEX.dark })], { before: 100, after: 20 }));
      const pubMeta = [
        pub.publisher,
        [pub.dateMonth, pub.dateYear].filter(Boolean).join(' '),
        pub.doi ? `DOI: ${pub.doi}` : undefined,
      ].filter(Boolean).join('   ·   ');
      if (pubMeta) children.push(para([run(pubMeta, { italic: true, size: 16, color: HEX.muted })], { after: 20 }));
      if (pub.url) children.push(new Paragraph({ spacing: { before: 10, after: 20 }, children: [link('Read Publication →', pub.url)] }));
      children.push(hRule());
    });
  }

  // ── Languages ──────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    children.push(sectionTitle('Languages'));
    const langRuns: any[] = [];
    data.languages.forEach(({ language, proficiency }, i) => {
      if (!language) return;
      if (i > 0) langRuns.push(run('   ·   ', { color: HEX.muted, size: 18 }));
      langRuns.push(run(language, { bold: true, size: 19, color: HEX.dark }));
      if (proficiency) langRuns.push(run(`  (${proficiency})`, { size: 17, color: HEX.mid }));
    });
    if (langRuns.length) children.push(new Paragraph({ spacing: { before: 20, after: 60 }, children: langRuns }));
  }

  // ── Awards ─────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    children.push(sectionTitle('Awards & Honors'));
    data.awards.forEach((a: AwardItem) => {
      children.push(new Paragraph({
        spacing: { before: 100, after: 20 },
        children: [
          run(a.title || '', { bold: true, size: 20, color: HEX.dark }),
          ...(a.date ? [run(`   ·   ${a.date}`, { size: 16, color: HEX.muted })] : []),
        ],
      }));
      if (a.issuer) children.push(para([run(a.issuer, { italic: true, size: 17, color: HEX.mid })], { after: 20 }));
      if (a.description) children.push(para([run(a.description, { size: 18, color: HEX.mid })], { after: 20 }));
      children.push(hRule());
    });
  }

  // ── Volunteer ──────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    children.push(sectionTitle('Volunteer Experience'));
    data.volunteer.forEach((v: VolunteerItem) => {
      children.push(para([run(v.role || '', { bold: true, size: 20, color: HEX.dark })], { before: 100, after: 20 }));
      const vDate = formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current);
      const vMeta = [v.org, vDate].filter(Boolean).join('   ·   ');
      if (vMeta) children.push(para([run(vMeta, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      if (v.description) {
        v.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], { before: 10, after: 10, indent: 200 }));
        });
      }
      children.push(hRule());
    });
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    children.push(sectionTitle('Achievements'));
    data.achievements.forEach((a: AchievementItem) => {
      children.push(new Paragraph({
        spacing: { before: 100, after: 20 },
        children: [
          run(a.title || '', { bold: true, size: 20, color: HEX.dark }),
          ...(a.date ? [run(`   ·   ${a.date}`, { size: 16, color: HEX.muted })] : []),
        ],
      }));
      if (a.description) children.push(para([run(a.description, { size: 18, color: HEX.mid })], { after: 20 }));
      children.push(hRule());
    });
  }

  // ── Footer note ────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  children.push(gap(160));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: HEX.divider, space: 2 } },
      children: [
        run(`Generated ${today}   ·   `, { size: 14, color: HEX.muted }),
        link('Powered by C Found · cfound.app', 'https://cfound.app'),
      ],
    })
  );

  // ── Assemble document ──────────────────────────────────────────────────────
  const docxDocument = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 20, color: HEX.dark } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~0.79 inch
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(docxDocument);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume_CFound.docx`;
  window.document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}