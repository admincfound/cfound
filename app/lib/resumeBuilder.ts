// resumeBuilder.ts — C Found Resume Engine v3.0
// Premium PDF + DOCX generator matching cfound.in profile design.

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
  type?: string;
  mode?: string;
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
    return { label: host, short: host };
  } catch {
    return { label: 'Link', short: 'Link' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Generator — C Found Premium v3
// Matches cfound.in profile card design: white bg, blue accents, bold italic name
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePDF(data: ProfileData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const W = 210;
  const H = 297;
  const ML = 20;
  const MR = 20;
  const CW = W - ML - MR;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Design tokens (matching cfound.in) ────────────────────────────────────
  const C = {
    blue:       [37,  99, 235] as [number,number,number],   // #2563EB
    blueMid:    [59, 130, 246] as [number,number,number],   // #3B82F6
    blueLight:  [219,234,254] as [number,number,number],    // #DBEAFE chip
    bluePale:   [239,246,255] as [number,number,number],    // #EFF6FF header tint
    dark:       [15,  23,  42] as [number,number,number],   // #0F172A
    mid:        [71,  85, 105] as [number,number,number],   // #475569
    muted:      [148,163,184] as [number,number,number],    // #94A3B8
    divider:    [226,232,240] as [number,number,number],    // #E2E8F0
    chipBg:     [241,245,249] as [number,number,number],    // #F1F5F9
    chipBorder: [203,213,225] as [number,number,number],    // #CBD5E1
    white:      [255,255,255] as [number,number,number],
    green:      [22, 163, 74] as [number,number,number],    // #16A34A current
    greenLight: [220,252,231] as [number,number,number],    // #DCFCE7
    accent:     [99,  102,241] as [number,number,number],   // indigo fallback
    pageBg:     [248,250,252] as [number,number,number],    // #F8FAFC very light
  };

  let y = 0;

  const rgb = (c: [number,number,number]) => ({ r: c[0], g: c[1], b: c[2] });
  const setColor = (c: [number,number,number]) => doc.setTextColor(...c);
  const setFill  = (c: [number,number,number]) => doc.setFillColor(...c);
  const setDraw  = (c: [number,number,number]) => doc.setDrawColor(...c);
  const setLW    = (w: number) => doc.setLineWidth(w);

  const newPage = () => {
    doc.addPage();
    y = 18;
    addPageBg();
    addWatermark();
  };

  const needsPage = (h: number) => {
    if (y + h > H - 20) { newPage(); return true; }
    return false;
  };

  // Subtle page background
  const addPageBg = () => {
    setFill(C.pageBg);
    doc.rect(0, 0, W, H, 'F');
    // Left blue side accent strip (ultra thin)
    setFill(C.blue);
    doc.rect(0, 0, 2, H, 'F');
  };

  const addWatermark = () => {
    doc.saveGraphicsState?.();
    doc.setGState?.(new (doc as any).GState({ opacity: 0.022 }));
    setColor(C.blue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(52);
    doc.text('C FOUND', W / 2, H / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState?.();
  };

  type Weight = 'normal' | 'bold' | 'italic' | 'bolditalic';
  const font = (style: Weight = 'normal', size = 9) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const textW = (t: string) => doc.getTextWidth(t);

  const hyperlink = (
    label: string, url: string,
    x: number, yy: number,
    color: [number,number,number] = C.blue,
    fontSize = 8
  ) => {
    font('normal', fontSize);
    setColor(color);
    doc.text(label, x, yy);
    const w = textW(label);
    doc.link(x, yy - fontSize * 0.35, w, fontSize * 0.45, { url });
    setDraw(color);
    setLW(0.15);
    doc.line(x, yy + 0.6, x + w, yy + 0.6);
  };

  // ── Card wrapper (white card with subtle shadow border) ──────────────────
  const drawCard = (cardY: number, cardH: number) => {
    // Soft shadow (offset rect)
    setFill([220, 225, 235]);
    doc.roundedRect(ML + 0.4, cardY + 0.6, CW, cardH, 2.5, 2.5, 'F');
    // White card
    setFill(C.white);
    setDraw(C.divider);
    setLW(0.3);
    doc.roundedRect(ML, cardY, CW, cardH, 2.5, 2.5, 'FD');
  };

  // ── Section header (card-style) ──────────────────────────────────────────
  const sectionHeader = (title: string) => {
    needsPage(16);
    y += 7;
    // Section label row
    setFill(C.blue);
    doc.roundedRect(ML, y - 3.8, 3, 6, 0.8, 0.8, 'F');
    setColor(C.dark);
    font('bold', 9);
    doc.text(title.toUpperCase(), ML + 6, y);
    y += 2.5;
    setDraw(C.divider);
    setLW(0.3);
    doc.line(ML, y, W - MR, y);
    y += 5;
  };

  // ── Skill chips ───────────────────────────────────────────────────────────
  const drawChips = (items: string[], accentChips = false) => {
    const GAP_X = 2.5;
    const GAP_Y = 5;
    const PX    = 4.5;
    const PY    = 2;
    const R     = 2;
    const FS    = 8;
    font('normal', FS);
    let cx = ML;
    const lineH = FS * 0.352 + PY * 2 + GAP_Y;

    items.forEach((skill) => {
      const sw = textW(skill);
      const cw = sw + PX * 2;
      if (cx + cw > W - MR) {
        cx = ML;
        y += lineH - GAP_Y + GAP_Y;
        needsPage(lineH);
      }
      if (accentChips) {
        setFill(C.blueLight);
        setDraw(C.blue);
      } else {
        setFill(C.chipBg);
        setDraw(C.chipBorder);
      }
      setLW(0.25);
      doc.roundedRect(cx, y - FS * 0.35 - PY, cw, FS * 0.35 * 2 + PY * 2, R, R, 'FD');
      setColor(accentChips ? C.blue : C.mid);
      font('normal', FS);
      doc.text(skill, cx + PX, y);
      cx += cw + GAP_X;
    });
    y += lineH;
  };

  // ── Divider line ─────────────────────────────────────────────────────────
  const hRule = (yy: number, color: [number,number,number] = C.divider, lw = 0.2) => {
    setDraw(color);
    setLW(lw);
    doc.line(ML, yy, W - MR, yy);
  };

  // ── Dot bullet label ──────────────────────────────────────────────────────
  const dotBullet = (color: [number,number,number] = C.blue) => {
    setFill(color);
    doc.circle(ML + 1.2, y - 1.2, 0.9, 'F');
  };

  // ── Experience block ──────────────────────────────────────────────────────
  const expBlock = (exp: ExperienceItem, isLast: boolean) => {
    const descLines = exp.description
      ? doc.splitTextToSize(exp.description.trim(), CW - 12).length : 0;
    const blockH = 24 + descLines * 4.5;
    needsPage(blockH);

    // Left dot
    dotBullet(exp.current ? C.green : C.blue);

    // Role
    font('bold', 11);
    setColor(C.dark);
    doc.text(exp.role || '', ML + 5, y);

    // Date aligned right
    const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
    font('normal', 7.5);
    setColor(C.muted);
    doc.text(dateStr, W - MR, y, { align: 'right' });

    // Current badge
    if (exp.current) {
      const badge = 'Current';
      const bw = textW(badge) + 5;
      const bx = ML + textW(exp.role || '') + 8;
      setFill(C.greenLight);
      doc.roundedRect(bx, y - 3.5, bw, 4.5, 1.2, 1.2, 'F');
      setColor(C.green);
      font('bold', 6.5);
      doc.text(badge, bx + 2.5, y);
    }
    y += 5.5;

    // Company · type
    font('normal', 8.5);
    setColor(C.mid);
    const company = [exp.company, exp.type].filter(Boolean).join('  ·  ');
    doc.text(company, ML + 5, y);
    y += 4.5;

    // Location · mode
    const locStr = [exp.location, exp.mode].filter(Boolean).join('  ·  ');
    if (locStr) {
      font('italic', 7.5);
      setColor(C.muted);
      doc.text(locStr, ML + 5, y);
      y += 4.5;
    }

    // Skills used
    if (exp.skills?.trim()) {
      const skills = exp.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      font('normal', 7.5);
      setColor(C.blue);
      doc.text('Skills: ' + skills.join('  ·  '), ML + 5, y);
      y += 4.5;
    }

    // Description
    if (exp.description?.trim()) {
      font('normal', 8.5);
      setColor(C.mid);
      const rawLines = exp.description.trim().split('\n').filter(Boolean);
      rawLines.forEach(raw => {
        const wrapped = doc.splitTextToSize(raw, CW - 12);
        wrapped.forEach((line: string, i: number) => {
          needsPage(5);
          if (i === 0) {
            setFill(C.muted);
            doc.circle(ML + 6.2, y - 1.2, 0.6, 'F');
          }
          doc.text(line, ML + 9, y);
          y += 4.5;
        });
      });
    }

    y += 3;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ── Project card ──────────────────────────────────────────────────────────
  const projectCard = (proj: ProjectItem, isLast: boolean) => {
    const descLines = proj.description
      ? doc.splitTextToSize(proj.description.trim(), CW - 12).length : 0;
    needsPage(22 + descLines * 4.5);

    // Category chip (top-right)
    if (proj.category) {
      const chipW = textW(proj.category) + 6;
      setFill(C.blueLight);
      setDraw(C.blue);
      setLW(0.2);
      doc.roundedRect(W - MR - chipW, y - 3.5, chipW, 4.5, 1.2, 1.2, 'FD');
      setColor(C.blue);
      font('normal', 6.5);
      doc.text(proj.category, W - MR - chipW + 3, y);
    }

    // Title
    font('bold', 11);
    setColor(C.dark);
    doc.text(proj.title || '', ML, y);
    y += 5.5;

    // Status
    if (proj.status) {
      const chipW = textW(proj.status) + 6;
      setFill(C.chipBg);
      setDraw(C.chipBorder);
      setLW(0.2);
      doc.roundedRect(ML, y - 3.5, chipW, 4.5, 1.2, 1.2, 'FD');
      setColor(C.mid);
      font('normal', 6.5);
      doc.text(proj.status, ML + 3, y);
      y += 5.5;
    }

    // Meta
    const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
    if (projDate) {
      font('italic', 7.5);
      setColor(C.muted);
      doc.text(projDate, ML, y);
      y += 4.5;
    }

    // Tech
    if (proj.technologies?.trim()) {
      font('normal', 7.5);
      setColor(C.blue);
      doc.text('Stack: ' + proj.technologies, ML, y);
      y += 4.5;
    }

    // Description
    if (proj.description?.trim()) {
      font('normal', 8.5);
      setColor(C.mid);
      proj.description.trim().split('\n').filter(Boolean).forEach(raw => {
        const wrapped = doc.splitTextToSize(raw, CW - 8);
        wrapped.forEach((line: string, i: number) => {
          needsPage(5);
          if (i === 0) {
            setFill(C.muted);
            doc.circle(ML + 2, y - 1.2, 0.6, 'F');
          }
          doc.text(line, ML + 5, y);
          y += 4.5;
        });
      });
    }

    // Links
    const links: Array<{ label: string; url: string }> = [];
    if (proj.demoUrl)     links.push({ label: '↗ Live Demo', url: proj.demoUrl });
    if (proj.githubUrl)   links.push({ label: '⌥ GitHub', url: proj.githubUrl });
    if (proj.websiteUrl)  links.push({ label: '↗ Website', url: proj.websiteUrl });
    if (proj.researchUrl) links.push({ label: '↗ Research', url: proj.researchUrl });
    if (links.length) {
      needsPage(6);
      let lx = ML;
      links.forEach(({ label, url }, i) => {
        if (i > 0) {
          setColor(C.muted);
          font('normal', 7.5);
          doc.text('  ·  ', lx, y);
          lx += textW('  ·  ');
        }
        hyperlink(label, url, lx, y, C.blue, 7.5);
        lx += textW(label) + 2;
      });
      y += 5.5;
    }

    y += 3;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ── Education card ────────────────────────────────────────────────────────
  const educationCard = (edu: EducationItem, isLast: boolean) => {
    needsPage(22);

    // Institution (right)
    font('normal', 8.5);
    setColor(C.mid);
    doc.text(edu.institution || '', W - MR, y, { align: 'right' });

    // Degree
    font('bold', 11);
    setColor(C.dark);
    doc.text(edu.degree || '', ML, y);
    y += 5.5;

    // Meta
    const yr = [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – ');
    const meta = [edu.department, yr, edu.cgpa ? `CGPA: ${edu.cgpa}` : undefined]
      .filter(Boolean).join('   ·   ');
    if (meta) {
      font('italic', 7.5);
      setColor(C.muted);
      doc.text(meta, ML, y);
      y += 4.5;
    }

    if (edu.achievements?.trim()) {
      font('normal', 8.5);
      setColor(C.mid);
      const wrapped = doc.splitTextToSize(edu.achievements.trim(), CW - 5);
      wrapped.forEach((line: string) => {
        needsPage(5); doc.text(line, ML, y); y += 4.5;
      });
    }

    y += 3;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ── Cert card ─────────────────────────────────────────────────────────────
  const certCard = (cert: CertificationItem, isLast: boolean) => {
    needsPage(20);
    font('normal', 8.5);
    setColor(C.mid);
    doc.text(cert.org || '', W - MR, y, { align: 'right' });

    font('bold', 10);
    setColor(C.dark);
    doc.text(cert.name || '', ML, y);
    y += 5;

    const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
    const certMeta = [certDate, cert.credentialId ? `ID: ${cert.credentialId}` : undefined]
      .filter(Boolean).join('   ·   ');
    if (certMeta) {
      font('italic', 7.5); setColor(C.muted);
      doc.text(certMeta, ML, y); y += 4.5;
    }
    if (cert.url) { hyperlink('Verify Certificate →', cert.url, ML, y, C.blue, 8); y += 5; }

    y += 2;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ── Publication ───────────────────────────────────────────────────────────
  const pubBlock = (pub: PublicationItem, isLast: boolean) => {
    needsPage(20);
    font('bold', 10);
    setColor(C.dark);
    const titleLines = doc.splitTextToSize(pub.title || '', CW);
    doc.text(titleLines, ML, y);
    y += titleLines.length * 5;

    const pubMeta = [
      pub.publisher,
      [pub.dateMonth, pub.dateYear].filter(Boolean).join(' '),
      pub.doi ? `DOI: ${pub.doi}` : undefined,
    ].filter(Boolean).join('   ·   ');
    if (pubMeta) {
      font('italic', 7.5); setColor(C.muted);
      doc.text(pubMeta, ML, y); y += 4.5;
    }
    if (pub.url) { hyperlink('Read Publication →', pub.url, ML, y, C.blue, 8); y += 5; }

    y += 2;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ── Language chips ────────────────────────────────────────────────────────
  const langChips = (langs: LanguageItem[]) => {
    const items = langs
      .filter(l => l.language)
      .map(l => l.proficiency ? `${l.language} (${l.proficiency})` : l.language!);
    drawChips(items);
  };

  // ── Highlight card (awards, achievements, volunteer) ──────────────────────
  const highlightCard = (title: string, sub?: string, desc?: string, date?: string, isLast = false) => {
    needsPage(18);
    // Blue left accent bar
    setFill(C.blue);
    doc.roundedRect(ML, y - 4.2, 2.5, desc ? 13 : 7, 0.8, 0.8, 'F');

    font('bold', 10);
    setColor(C.dark);
    doc.text(title, ML + 6, y);
    if (date) {
      font('normal', 7.5); setColor(C.muted);
      doc.text(date, W - MR, y, { align: 'right' });
    }
    y += 5;

    if (sub) {
      font('italic', 8); setColor(C.mid);
      doc.text(sub, ML + 6, y); y += 4.5;
    }
    if (desc) {
      font('normal', 8.5); setColor(C.mid);
      const wrapped = doc.splitTextToSize(desc.trim(), CW - 8);
      wrapped.forEach((line: string) => {
        needsPage(5); doc.text(line, ML + 6, y); y += 4.5;
      });
    }

    y += 4;
    if (!isLast) { hRule(y - 1, C.divider, 0.2); y += 3; }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Page background + left strip
  addPageBg();
  addWatermark();

  // ── HEADER CARD ───────────────────────────────────────────────────────────
  const HEADER_H = 62;
  // Header gradient-tinted background
  setFill(C.bluePale);
  doc.roundedRect(ML, 8, CW, HEADER_H, 3, 3, 'F');
  // Blue top border on card
  setFill(C.blue);
  doc.roundedRect(ML, 8, CW, 2.5, 1, 1, 'F');

  y = 18;

  // ── PHOTO ─────────────────────────────────────────────────────────────────
  const PHOTO = 28;
  let nameAreaW = CW;
  const usePhoto = isImageKitPhoto(data.photoURL);

  if (usePhoto) {
    try {
      const photoUrl = `${data.photoURL}?tr=w-240,h-240,c-at_max,f-jpg,q-95,fo-face`;
      const imgData = await fetchImageAsBase64(photoUrl);
      if (imgData) {
        const px = W - MR - PHOTO - 2;
        const py = 13;
        // Shadow
        setFill([200, 210, 230]);
        doc.roundedRect(px + 0.5, py + 0.5, PHOTO, PHOTO, 4, 4, 'F');
        // White border ring
        setFill(C.white);
        doc.roundedRect(px - 1, py - 1, PHOTO + 2, PHOTO + 2, 5, 5, 'F');
        // Photo
        doc.addImage(imgData, 'JPEG', px, py, PHOTO, PHOTO, undefined, 'FAST');
        // Subtle blue ring
        setDraw(C.blue);
        setLW(0.5);
        doc.roundedRect(px - 1, py - 1, PHOTO + 2, PHOTO + 2, 5, 5, 'S');
        nameAreaW = CW - PHOTO - 10;
      }
    } catch { /* skip */ }
  }

  // ── NAME (bold italic, large — matches RISHIKESH style) ──────────────────
  setColor(C.dark);
  font('bolditalic', 24);
  doc.text(data.displayName || '', ML + 6, y);
  y += 8;

  // ── ROLE ─────────────────────────────────────────────────────────────────
  const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
  if (roleText) {
    setColor(C.blue);
    font('bold', 10.5);
    doc.text(roleText, ML + 6, y);
    y += 5.5;
  }

  // ── CONTACT LINE ─────────────────────────────────────────────────────────
  let cx2 = ML + 6;
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');

  const contactItems: Array<{ text: string; href?: string }> = [];
  if (data.email) contactItems.push({ text: data.email, href: `mailto:${data.email}` });
  if (data.phone) contactItems.push({ text: data.phone, href: `tel:${data.phone}` });
  if (loc) contactItems.push({ text: loc });

  if (contactItems.length) {
    contactItems.forEach((item, i) => {
      if (i > 0) {
        font('normal', 8); setColor(C.muted);
        doc.text('   |   ', cx2, y);
        cx2 += textW('   |   ');
      }
      if (item.href) {
        hyperlink(item.text, item.href, cx2, y, C.dark, 8);
      } else {
        font('normal', 8); setColor(C.mid);
        doc.text(item.text, cx2, y);
      }
      cx2 += textW(item.text);
    });
    y += 5;
  }

  // ── SOCIAL LINKS ─────────────────────────────────────────────────────────
  const profLinks: Array<{ label: string; url: string }> = [
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
    data.researchgateUrl && { label: 'ResearchGate',url: data.researchgateUrl },
    data.stackoverflowUrl && { label: 'Stack Overflow', url: data.stackoverflowUrl },
    data.otherUrl      && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (profLinks.length) {
    let lx = ML + 6;
    profLinks.forEach(({ label, url }, i) => {
      if (lx + textW(label) + 4 > ML + nameAreaW) { y += 5; lx = ML + 6; }
      if (i > 0 && lx > ML + 6) {
        font('normal', 7.5); setColor(C.muted);
        doc.text('  ·  ', lx, y);
        lx += textW('  ·  ');
      }
      hyperlink(label, url, lx, y, C.blue, 7.5);
      lx += textW(label);
    });
    y += 5.5;
  }

  // Bottom of header card
  y = Math.max(y, 63);

  // ── BODY starts after header card ────────────────────────────────────────
  y = 8 + HEADER_H + 8;

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    sectionHeader('About Me');
    // Estimate card height
    const bioLines = doc.splitTextToSize(data.bio.trim(), CW - 10);
    const cardH = bioLines.length * 5 + 10;
    const cardY = y - 2;
    drawCard(cardY, cardH);
    setColor(C.mid);
    font('normal', 9);
    y += 3;
    bioLines.forEach((line: string) => {
      needsPage(5); doc.text(line, ML + 5, y); y += 5;
    });
    y += 5;
  }

  // ── SKILLS ────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    sectionHeader('Skills');
    drawChips(data.skills, false);
    y += 2;
  }

  // ── EXPERIENCE ────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    sectionHeader('Experience');
    data.experiences.forEach((exp, i) =>
      expBlock(exp, i === (data.experiences!.length - 1)));
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    sectionHeader('Projects');
    data.projects.forEach((proj, i) =>
      projectCard(proj, i === (data.projects!.length - 1)));
  }

  // ── EDUCATION ─────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sectionHeader('Education');
    data.education.forEach((edu, i) =>
      educationCard(edu, i === (data.education!.length - 1)));
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sectionHeader('Certifications');
    data.certifications.forEach((cert, i) =>
      certCard(cert, i === (data.certifications!.length - 1)));
  }

  // ── PUBLICATIONS ──────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    sectionHeader('Publications');
    data.publications.forEach((pub, i) =>
      pubBlock(pub, i === (data.publications!.length - 1)));
  }

  // ── LANGUAGES ─────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    sectionHeader('Languages');
    langChips(data.languages);
    y += 2;
  }

  // ── AWARDS ────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    sectionHeader('Awards & Honors');
    data.awards.forEach((a, i) =>
      highlightCard(a.title || '', a.issuer, a.description, a.date, i === (data.awards!.length - 1)));
  }

  // ── VOLUNTEER ─────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    sectionHeader('Volunteer Experience');
    data.volunteer.forEach((v, i) => {
      const meta = formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current);
      highlightCard(v.role || '', [v.org, meta].filter(Boolean).join('  ·  '), v.description, undefined, i === (data.volunteer!.length - 1));
    });
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    sectionHeader('Achievements');
    data.achievements.forEach((a, i) =>
      highlightCard(a.title || '', undefined, a.description, a.date, i === (data.achievements!.length - 1)));
  }

  // ── FOOTER (all pages) ────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer bar
    setFill(C.bluePale);
    doc.rect(0, H - 14, W, 14, 'F');
    setFill(C.blue);
    doc.rect(0, H - 14, 2, 14, 'F');
    setDraw(C.divider);
    setLW(0.3);
    doc.line(0, H - 14, W, H - 14);

    setColor(C.muted);
    font('normal', 6.5);
    doc.text(`${data.displayName || ''}  ·  Generated ${today}`, ML + 4, H - 8);
    doc.text('Powered by C Found  ·  cfound.in', W / 2, H - 8, { align: 'center' });
    doc.text(`Page ${i} of ${totalPages}`, W - MR, H - 8, { align: 'right' });
  }

  doc.save(`${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume_CFound.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX Generator — C Found Premium v3
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDOCX(data: ProfileData): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
    ExternalHyperlink, HeadingLevel,
  } = await import("docx");

  const HEX = {
    blue:    '2563EB',
    dark:    '0F172A',
    mid:     '475569',
    muted:   '94A3B8',
    divider: 'E2E8F0',
    green:   '16A34A',
    greenBg: 'DCFCE7',
    chipBg:  'F1F5F9',
    bluePale:'EFF6FF',
    white:   'FFFFFF',
  };

  const FONT     = 'Calibri';
  const FONT_MONO= 'Consolas';

  const run = (text: string, opts: {
    bold?: boolean; italic?: boolean; size?: number;
    color?: string; font?: string; underline?: boolean; allCaps?: boolean;
  } = {}) =>
    new TextRun({
      text,
      bold:     opts.bold    ?? false,
      italics:  opts.italic  ?? false,
      size:     opts.size    ?? 20,
      color:    opts.color   ?? HEX.dark,
      font:     opts.font    ?? FONT,
      underline: opts.underline ? {} : undefined,
      allCaps:  opts.allCaps  ?? false,
    });

  const link = (label: string, url: string, size = 18) =>
    new ExternalHyperlink({
      link: url,
      children: [run(label, { color: HEX.blue, underline: true, size })],
    });

  const para = (children: any[], opts: {
    before?: number; after?: number; indent?: number;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
    borderBottom?: boolean; borderTop?: boolean; borderLeft?: boolean;
    shading?: string;
  } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing:   { before: opts.before ?? 0, after: opts.after ?? 40 },
      indent:    opts.indent ? { left: opts.indent } : undefined,
      border: {
        ...(opts.borderBottom ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: HEX.divider, space: 1 } } : {}),
        ...(opts.borderTop    ? { top:    { style: BorderStyle.SINGLE, size: 4, color: HEX.divider, space: 1 } } : {}),
        ...(opts.borderLeft   ? { left:   { style: BorderStyle.SINGLE, size: 16, color: HEX.blue,   space: 4 } } : {}),
      },
      shading:  opts.shading ? { type: 'clear' as any, fill: opts.shading } : undefined,
      children,
    });

  const hRule  = () => para([], { borderBottom: true, before: 80, after: 80 });
  const gap    = (sz = 60) => new Paragraph({ spacing: { before: sz, after: 0 }, children: [] });

  // Section title with blue underline
  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 320, after: 100 },
      border:  { bottom: { style: BorderStyle.SINGLE, size: 8, color: HEX.blue, space: 2 } },
      children: [
        run('  ', { size: 18 }),
        run(title.toUpperCase(), { bold: true, size: 19, color: HEX.blue, allCaps: true }),
      ],
    });

  const children: any[] = [];

  // ── HEADER: shaded box ───────────────────────────────────────────────────
  // Name — large bold italic
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      shading: { type: 'clear' as any, fill: HEX.bluePale },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: HEX.blue, space: 1 } },
      children: [
        run(data.displayName || '', { bold: true, italic: true, size: 56, color: HEX.dark }),
      ],
    })
  );

  // Role
  const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
  if (roleText) {
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 60 },
        shading: { type: 'clear' as any, fill: HEX.bluePale },
        children: [run(roleText, { bold: true, size: 23, color: HEX.blue })],
      })
    );
  }

  // Contact
  const contactParts: any[] = [];
  if (data.email) contactParts.push(link(data.email, `mailto:${data.email}`, 19));
  if (data.phone) {
    if (contactParts.length) contactParts.push(run('   |   ', { color: HEX.muted, size: 18 }));
    contactParts.push(link(data.phone, `tel:${data.phone}`, 19));
  }
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
  if (loc) {
    if (contactParts.length) contactParts.push(run('   |   ', { color: HEX.muted, size: 18 }));
    contactParts.push(run(loc, { color: HEX.mid, size: 19 }));
  }
  if (contactParts.length) {
    children.push(new Paragraph({
      spacing: { before: 0, after: 60 },
      shading: { type: 'clear' as any, fill: HEX.bluePale },
      children: contactParts,
    }));
  }

  // Professional links
  const profLinks: Array<{ label: string; url: string }> = [
    data.linkedinUrl      && { label: 'LinkedIn',        url: data.linkedinUrl },
    data.githubUrl        && { label: 'GitHub',          url: data.githubUrl },
    data.portfolioUrl     && { label: 'Portfolio',       url: data.portfolioUrl },
    data.twitterUrl       && { label: 'X (Twitter)',     url: data.twitterUrl },
    data.behanceUrl       && { label: 'Behance',         url: data.behanceUrl },
    data.dribbbleUrl      && { label: 'Dribbble',        url: data.dribbbleUrl },
    data.youtubeUrl       && { label: 'YouTube',         url: data.youtubeUrl },
    data.mediumUrl        && { label: 'Medium',          url: data.mediumUrl },
    data.kaggleUrl        && { label: 'Kaggle',          url: data.kaggleUrl },
    data.researchgateUrl  && { label: 'ResearchGate',    url: data.researchgateUrl },
    data.scholarUrl       && { label: 'Google Scholar',  url: data.scholarUrl },
    data.stackoverflowUrl && { label: 'Stack Overflow',  url: data.stackoverflowUrl },
    data.otherUrl         && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (profLinks.length) {
    const linkChildren: any[] = [];
    profLinks.forEach(({ label, url }, i) => {
      if (i > 0) linkChildren.push(run('   ·   ', { color: HEX.muted, size: 17 }));
      linkChildren.push(link(label, url, 17));
    });
    children.push(new Paragraph({
      spacing: { before: 0, after: 100 },
      shading: { type: 'clear' as any, fill: HEX.bluePale },
      children: linkChildren,
    }));
  }

  // ── ABOUT ────────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    children.push(sectionTitle('About Me'));
    data.bio.trim().split('\n').filter(Boolean).forEach(line => {
      children.push(para([run(line, { color: HEX.mid, size: 20 })], { before: 20, after: 20 }));
    });
    children.push(gap(60));
  }

  // ── SKILLS ───────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    children.push(sectionTitle('Skills'));
    children.push(
      para([run(data.skills.join('   ·   '), { color: HEX.mid, size: 19 })], { after: 60 })
    );
  }

  // ── EXPERIENCE ───────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    children.push(sectionTitle('Experience'));
    data.experiences.forEach((exp: ExperienceItem) => {
      // Role row
      const roleRuns: any[] = [run(exp.role || '', { bold: true, size: 23, color: HEX.dark })];
      if (exp.current) roleRuns.push(run('  ● Current', { bold: true, size: 16, color: HEX.green }));
      children.push(new Paragraph({ spacing: { before: 140, after: 20 }, children: roleRuns }));

      // Company · type
      const cStr = [exp.company, exp.type].filter(Boolean).join('  ·  ');
      children.push(para([run(cStr, { size: 19, color: HEX.mid })], { before: 0, after: 20 }));

      // Date · location · mode
      const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      const locStr = [dateStr, exp.location, exp.mode].filter(Boolean).join('   ·   ');
      if (locStr) children.push(para([run(locStr, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));

      // Skills
      if (exp.skills?.trim()) {
        children.push(para([
          run('Skills: ', { bold: true, size: 17, color: HEX.blue }),
          run(exp.skills,  { size: 17, color: HEX.blue }),
        ], { after: 20 }));
      }

      // Description bullets
      if (exp.description?.trim()) {
        exp.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], {
            before: 10, after: 10, indent: 240,
          }));
        });
      }

      children.push(hRule());
    });
  }

  // ── PROJECTS ─────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    children.push(sectionTitle('Projects'));
    data.projects.forEach((proj: ProjectItem) => {
      const titleRuns: any[] = [run(proj.title || '', { bold: true, size: 23, color: HEX.dark })];
      if (proj.status)   titleRuns.push(run(`   [ ${proj.status} ]`, { size: 17, color: HEX.blue }));
      if (proj.category) titleRuns.push(run(`   ${proj.category}`, { italic: true, size: 16, color: HEX.muted }));
      children.push(new Paragraph({ spacing: { before: 140, after: 20 }, children: titleRuns }));

      const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      if (projDate) children.push(para([run(projDate, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));

      if (proj.technologies?.trim()) {
        children.push(para([
          run('Stack: ', { bold: true, size: 17, color: HEX.blue }),
          run(proj.technologies, { size: 17, color: HEX.blue }),
        ], { after: 20 }));
      }

      if (proj.description?.trim()) {
        proj.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], {
            before: 10, after: 10, indent: 240,
          }));
        });
      }

      const linkRuns: any[] = [];
      if (proj.demoUrl)    { linkRuns.push(link('↗ Live Demo', proj.demoUrl)); }
      if (proj.githubUrl)  { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('GitHub', proj.githubUrl)); }
      if (proj.websiteUrl) { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('Website', proj.websiteUrl)); }
      if (proj.researchUrl){ if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.muted, size: 17 })); linkRuns.push(link('Research', proj.researchUrl)); }
      if (linkRuns.length) children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: linkRuns }));

      children.push(hRule());
    });
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    children.push(sectionTitle('Education'));
    data.education.forEach((edu: EducationItem) => {
      children.push(new Paragraph({
        spacing: { before: 140, after: 20 },
        children: [
          run(edu.degree || '', { bold: true, size: 23, color: HEX.dark }),
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

  // ── CERTIFICATIONS ───────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    children.push(sectionTitle('Certifications'));
    data.certifications.forEach((cert: CertificationItem) => {
      children.push(new Paragraph({
        spacing: { before: 120, after: 20 },
        children: [
          run(cert.name || '', { bold: true, size: 21, color: HEX.dark }),
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

  // ── PUBLICATIONS ──────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    children.push(sectionTitle('Publications'));
    data.publications.forEach((pub: PublicationItem) => {
      children.push(para([run(pub.title || '', { bold: true, size: 21, color: HEX.dark })], { before: 120, after: 20 }));
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

  // ── LANGUAGES ─────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    children.push(sectionTitle('Languages'));
    const langRuns: any[] = [];
    data.languages.forEach(({ language, proficiency }, i) => {
      if (!language) return;
      if (i > 0) langRuns.push(run('   ·   ', { color: HEX.muted, size: 18 }));
      langRuns.push(run(language, { bold: true, size: 20, color: HEX.dark }));
      if (proficiency) langRuns.push(run(`  (${proficiency})`, { size: 17, color: HEX.mid }));
    });
    if (langRuns.length) children.push(new Paragraph({ spacing: { before: 20, after: 80 }, children: langRuns }));
  }

  // ── AWARDS ────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    children.push(sectionTitle('Awards & Honors'));
    data.awards.forEach((a: AwardItem) => {
      children.push(para([
        run(a.title || '', { bold: true, size: 21, color: HEX.dark }),
        ...(a.date ? [run(`   ·   ${a.date}`, { size: 16, color: HEX.muted })] : []),
      ], { before: 120, after: 20, borderLeft: true }));
      if (a.issuer)      children.push(para([run(a.issuer, { italic: true, size: 17, color: HEX.mid })], { after: 20, borderLeft: true }));
      if (a.description) children.push(para([run(a.description, { size: 18, color: HEX.mid })], { after: 20, borderLeft: true }));
      children.push(hRule());
    });
  }

  // ── VOLUNTEER ─────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    children.push(sectionTitle('Volunteer Experience'));
    data.volunteer.forEach((v: VolunteerItem) => {
      children.push(para([run(v.role || '', { bold: true, size: 21, color: HEX.dark })], { before: 120, after: 20, borderLeft: true }));
      const vMeta = [v.org, formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current)].filter(Boolean).join('   ·   ');
      if (vMeta) children.push(para([run(vMeta, { italic: true, size: 17, color: HEX.muted })], { after: 20, borderLeft: true }));
      if (v.description?.trim()) {
        v.description.trim().split('\n').filter(Boolean).forEach(line => {
          children.push(para([run(`•  ${line}`, { size: 19, color: HEX.mid })], { before: 10, after: 10, indent: 240 }));
        });
      }
      children.push(hRule());
    });
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    children.push(sectionTitle('Achievements'));
    data.achievements.forEach((a: AchievementItem) => {
      children.push(para([
        run(a.title || '', { bold: true, size: 21, color: HEX.dark }),
        ...(a.date ? [run(`   ·   ${a.date}`, { size: 16, color: HEX.muted })] : []),
      ], { before: 120, after: 20, borderLeft: true }));
      if (a.description) children.push(para([run(a.description, { size: 18, color: HEX.mid })], { after: 20, borderLeft: true }));
      children.push(hRule());
    });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  children.push(gap(200));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 80, after: 0 },
      border:    { top: { style: BorderStyle.SINGLE, size: 6, color: HEX.blue, space: 4 } },
      shading:   { type: 'clear' as any, fill: HEX.bluePale },
      children:  [
        run(`Generated ${today}   ·   `, { size: 14, color: HEX.muted }),
        link('Powered by C Found · cfound.in', 'https://cfound.in', 14),
      ],
    })
  );

  // ── ASSEMBLE ──────────────────────────────────────────────────────────────
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
            size:   { width: 11906, height: 16838 },
            margin: { top: 1000, right: 1100, bottom: 1000, left: 1100 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(docxDocument);
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url    = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href  = url;
  anchor.download = `${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume_CFound.docx`;
  window.document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}