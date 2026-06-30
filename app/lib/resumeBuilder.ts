// resumeBuilder.ts — C Found Resume Engine v3.0
// Premium PDF + DOCX generator. No AI rewriting. Pure profile data.
// Rendering layer only. All interfaces, types, and exported function
// signatures are unchanged from v2.0.

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

// Reads natural pixel dimensions of a base64/data-URL image so we can
// "contain"-fit it into a box without ever cropping the portrait.
function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

// Pure "contain" fit math — never upscales/crops, always preserves aspect ratio.
function containFit(boxW: number, boxH: number, imgW: number, imgH: number) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offsetX = (boxW - drawW) / 2;
  const offsetY = (boxH - drawH) / 2;
  return { drawW, drawH, offsetX, offsetY };
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
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePDF(data: ProfileData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const W  = 210;
  const H  = 297;
  const ML = 22;
  const MR = 22;
  const MT = 20;
  const MB = 16;
  const CW = W - ML - MR;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Design tokens (unchanged) ───────────────────────────────────────────────
  const C = {
    accent:  [37,  99,  235] as [number, number, number],  // #2563EB — the only color used
    ink:     [10,  10,  10]  as [number, number, number],  // name
    body:    [28,  28,  28]  as [number, number, number],  // headings / primary text
    label:   [75,  75,  75]  as [number, number, number],  // secondary text
    muted:   [145, 145, 145] as [number, number, number],  // dates / meta
    rule:    [222, 222, 222] as [number, number, number],  // dividers
    white:   [255, 255, 255] as [number, number, number],
  };

  const PHOTO_BOX = 30; // mm, fixed across all resumes
  const PHOTO_GAP = 8;  // mm, gap between photo and text block

  // ── Spacing system ───────────────────────────────────────────────────────────
  // Every vertical gap in the document is driven from these constants so the
  // layout reads as compact and consistent, the same way the DOCX does.
  const SPACE = {
    headerToSection:   9,    // header block → first section divider/title
    sectionTitleAbove: 7,    // gap before a section title (≈ section → section)
    sectionTitleGap:   2.6,  // title text → its underline rule
    sectionTitleBelow: 5,    // rule → first line of section content
    paragraphLine:     4.6,  // wrapped line height within a paragraph block
    paragraphGap:      3.5,  // gap after a standalone paragraph block (bio/skills/etc.)
    metaLine:          4.3,  // role/company/date/meta line height
    bulletLine:        4.3,  // wrapped bullet continuation line height
    bulletGap:         1.4,  // gap between distinct bullet points
    entryGap:          2.2,  // gap after an entry's content, before its divider
    dividerToNext:     4.6,  // divider → next entry
  };

  let y = 0;

  // ── Core helpers ───────────────────────────────────────────────────────────

  const setColor = (c: [number, number, number]) => doc.setTextColor(...c);
  const setFill  = (c: [number, number, number]) => doc.setFillColor(...c);
  const setDraw  = (c: [number, number, number]) => doc.setDrawColor(...c);
  const setLW    = (w: number)                   => doc.setLineWidth(w);

  const newPage = () => {
    doc.addPage();
    y = MT;
  };

  // Reserve `h` mm of vertical space; if it won't fit on the current page,
  // start a fresh page instead — this is what prevents headings/entries
  // from being orphaned at the bottom of a page. Content is only ever
  // pushed to a new page when it genuinely doesn't fit.
  const needsPage = (h: number) => {
    if (y + h > H - MB) {
      newPage();
      return true;
    }
    return false;
  };

  const hRule = (yy: number, lw = 0.2, color: [number, number, number] = C.rule) => {
    setDraw(color);
    setLW(lw);
    doc.line(ML, yy, W - MR, yy);
  };

  type FontStyle = 'normal' | 'bold' | 'italic';
  const font = (style: FontStyle = 'normal', size = 9) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const textW = (t: string) => doc.getTextWidth(t);

  const hyperlink = (
    label: string,
    url: string,
    x: number,
    yy: number,
    color: [number, number, number] = C.accent,
    fontSize = 8
  ) => {
    font('normal', fontSize);
    setColor(color);
    doc.text(label, x, yy);
    const w = textW(label);
    doc.link(x, yy - fontSize * 0.35, w, fontSize * 0.45, { url });
  };

  // Section header — small uppercase label + thin rule. Spacing above is
  // dynamic: it's the only place "section → section" gap lives, so short
  // sections never leave a large dead zone before the next title.
  const sectionHeader = (title: string) => {
    needsPage(SPACE.sectionTitleAbove + SPACE.sectionTitleGap + SPACE.sectionTitleBelow + 6);
    y += SPACE.sectionTitleAbove;
    font('bold', 8);
    setColor(C.muted);
    doc.text(title.toUpperCase(), ML, y);
    y += SPACE.sectionTitleGap;
    hRule(y, 0.3);
    y += SPACE.sectionTitleBelow;
  };

  // Close out an entry: small gap, thin divider, gap to the next entry.
  // Only drawn between entries — never after the last one in a section,
  // so a short section doesn't trail empty space.
  const entryDivider = (isLast: boolean) => {
    if (isLast) return;
    y += SPACE.entryGap;
    hRule(y, 0.18);
    y += SPACE.dividerToNext;
  };

  // Estimate the height an entry block will occupy, so we can decide
  // whether to keep it intact on the current page or push it whole
  // onto the next one (never split an entry mid-way).
  const estimateLines = (text: string | undefined, width: number): number =>
    text?.trim() ? doc.splitTextToSize(text.trim(), width).length : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD THE DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Header: photo LEFT, text block to its right, vertically aligned ───────
  const usePhoto = isImageKitPhoto(data.photoURL);
  let photoImgData: string | null = null;
  let photoDims: { width: number; height: number } | null = null;

  if (usePhoto && data.photoURL) {
    try {
      const photoUrl = `${data.photoURL}?tr=w-400,h-400,c-at_max,f-jpg,q-95`;
      photoImgData = await fetchImageAsBase64(photoUrl);
      if (photoImgData) photoDims = await loadImageDimensions(photoImgData);
    } catch {
      photoImgData = null;
    }
  }

  const hasPhoto = !!(photoImgData && photoDims);
  const textX = hasPhoto ? ML + PHOTO_BOX + PHOTO_GAP : ML;
  const textW_ = hasPhoto ? CW - PHOTO_BOX - PHOTO_GAP : CW;

  y = MT;
  const headerTop = y;

  if (hasPhoto && photoImgData && photoDims) {
    // Frame: rounded-corner border, white background — never crops the portrait.
    setFill(C.white);
    setDraw(C.rule);
    setLW(0.35);
    doc.roundedRect(ML, headerTop, PHOTO_BOX, PHOTO_BOX, 3, 3, 'FD');

    const { drawW, drawH, offsetX, offsetY } = containFit(
      PHOTO_BOX - 1.2, PHOTO_BOX - 1.2, photoDims.width, photoDims.height
    );
    doc.addImage(
      photoImgData,
      'JPEG',
      ML + 0.6 + offsetX,
      headerTop + 0.6 + offsetY,
      drawW,
      drawH,
      undefined,
      'FAST'
    );
  }

  // Name — vertically anchored near the top of the photo box.
  let ty = headerTop + 7;
  font('bold', 25);
  setColor(C.ink);
  doc.text(data.displayName || '', textX, ty);
  ty += 7.5;

  // Current Position
  const currentExp = data.experiences?.find((e) => e.current) ?? data.experiences?.[0];

  const roleText = currentExp?.role || "";
  const companyText = currentExp?.company || "";
  if (roleText) {
    font('bold', 11);
    setColor(C.accent);
    doc.text(roleText, textX, ty);
    ty += 5;
  }

  if (companyText) {
    font('normal', 10);
    setColor(C.label);
    doc.text(companyText, textX, ty);
    ty += 6;
  }

  // Contact line
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
  if (loc) contactParts.push(loc);

  if (contactParts.length) {
    let cx = textX;
    font('normal', 8.5);
    contactParts.forEach((part, i) => {
      if (i > 0) {
        setColor(C.rule);
        doc.text('   ·   ', cx, ty);
        cx += textW('   ·   ');
      }
      if (part === data.email) {
        hyperlink(part, `mailto:${part}`, cx, ty, C.accent, 8.5);
      } else if (part === data.phone) {
        hyperlink(part, `tel:${part}`, cx, ty, C.muted, 8.5);
      } else {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(part, cx, ty);
      }
      cx += textW(part);
    });
    ty += 5.5;
  }

  // Professional links — wraps within the text column, never under the photo.
  const profileLinks: Array<{ label: string; url: string }> = [
    data.linkedinUrl      && { label: 'LinkedIn',        url: data.linkedinUrl },
    data.githubUrl        && { label: 'GitHub',          url: data.githubUrl },
    data.portfolioUrl     && { label: 'Portfolio',       url: data.portfolioUrl },
    data.twitterUrl       && { label: 'X',               url: data.twitterUrl },
    data.behanceUrl       && { label: 'Behance',         url: data.behanceUrl },
    data.dribbbleUrl      && { label: 'Dribbble',        url: data.dribbbleUrl },
    data.youtubeUrl       && { label: 'YouTube',         url: data.youtubeUrl },
    data.mediumUrl        && { label: 'Medium',          url: data.mediumUrl },
    data.kaggleUrl        && { label: 'Kaggle',          url: data.kaggleUrl },
    data.leetcodeUrl      && { label: 'LeetCode',        url: data.leetcodeUrl },
    data.scholarUrl       && { label: 'Google Scholar',  url: data.scholarUrl },
    data.researchgateUrl  && { label: 'ResearchGate',    url: data.researchgateUrl },
    data.stackoverflowUrl && { label: 'Stack Overflow',  url: data.stackoverflowUrl },
    data.otherUrl         && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (profileLinks.length) {
    let lx = textX;
    profileLinks.forEach(({ label, url }, i) => {
      const needed = textW(label) + (i > 0 && lx > textX ? textW('   ·   ') : 0);
      if (lx + needed > textX + textW_) {
        ty += 5;
        lx = textX;
      }
      if (i > 0 && lx > textX) {
        font('normal', 8);
        setColor(C.rule);
        doc.text('   ·   ', lx, ty);
        lx += textW('   ·   ');
      }
      hyperlink(label, url, lx, ty, C.accent, 8);
      lx += textW(label);
    });
    ty += 5;
  }

  // Header block height = tallest of (photo box, text stack). The gap to
  // the first section is fixed and modest — "Header → Section" in the spec.
  y = Math.max(headerTop + PHOTO_BOX, ty) + 3;
  hRule(y, 0.4);
  y += SPACE.headerToSection - 3;

  // ── Summary / Bio ──────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    sectionHeader('Summary');
    font('normal', 9.5);
    setColor(C.label);
    const bioLines = doc.splitTextToSize(data.bio.trim(), CW);
    bioLines.forEach((line: string) => {
      needsPage(SPACE.paragraphLine);
      doc.text(line, ML, y);
      y += SPACE.paragraphLine;
    });
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    sectionHeader('Experience');

    data.experiences.forEach((exp, idx) => {
      const descLineCount = exp.description
        ? exp.description.trim().split('\n').filter(Boolean)
            .reduce((sum, raw) => sum + doc.splitTextToSize(raw, CW - 6).length, 0)
        : 0;
      const skillLineCount = exp.skills?.trim() ? estimateLines(exp.skills, CW - 4) : 0;
      const blockHeight = 10 + (exp.company || exp.type || exp.mode ? SPACE.metaLine : 0)
        + (exp.location ? SPACE.metaLine : 0) + skillLineCount * SPACE.metaLine + descLineCount * SPACE.bulletLine;
      needsPage(blockHeight);

      font('bold', 10.5);
      setColor(C.body);
      doc.text(exp.role || '', ML, y);

      const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      if (dateStr) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(dateStr, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      const companyParts = [exp.company, exp.type, exp.mode].filter(Boolean);
      if (companyParts.length) {
        font('normal', 9);
        setColor(C.label);
        doc.text(companyParts.join('   ·   '), ML, y);
        y += SPACE.metaLine;
      }

      if (exp.location) {
        font('italic', 8);
        setColor(C.muted);
        doc.text(exp.location, ML, y);
        y += SPACE.metaLine;
      }

      if (exp.skills?.trim()) {
        font('normal', 8.3);
        setColor(C.accent);
        const skillList = exp.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean).join('   ·   ');
        const skLines = doc.splitTextToSize(skillList, CW - 4);
        skLines.forEach((line: string) => {
          doc.text(line, ML, y);
          y += SPACE.metaLine;
        });
      }

      if (exp.description?.trim()) {
        font('normal', 8.8);
        setColor(C.label);
        const rawLines = exp.description.trim().split('\n').filter(Boolean);
        rawLines.forEach((raw, bi) => {
          const wrapped = doc.splitTextToSize(raw, CW - 6);
          wrapped.forEach((line: string, i: number) => {
            doc.text((i === 0 ? '—  ' : '    ') + line, ML + 2, y);
            y += SPACE.bulletLine;
          });
          if (bi < rawLines.length - 1) y += SPACE.bulletGap;
        });
      }

      entryDivider(idx === (data.experiences?.length ?? 0) - 1);
    });
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    sectionHeader('Projects');

    data.projects.forEach((proj, idx) => {
      const descLineCount = proj.description
        ? proj.description.trim().split('\n').filter(Boolean)
            .reduce((sum, raw) => sum + doc.splitTextToSize(raw, CW - 6).length, 0)
        : 0;
      const blockHeight = 10 + (proj.category ? SPACE.metaLine : 0) + (proj.technologies ? SPACE.metaLine : 0)
        + descLineCount * SPACE.bulletLine + 5;
      needsPage(blockHeight);

      font('bold', 10.5);
      setColor(C.body);
      doc.text(proj.title || '', ML, y);

      const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      if (projDate) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(projDate, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      if (proj.category) {
        font('italic', 8);
        setColor(C.muted);
        doc.text(proj.category, ML, y);
        y += SPACE.metaLine;
      }

      if (proj.technologies?.trim()) {
        font('normal', 8.3);
        setColor(C.accent);
        const techLines = doc.splitTextToSize(proj.technologies, CW - 4);
        techLines.forEach((line: string) => {
          doc.text(line, ML, y);
          y += SPACE.metaLine;
        });
      }

      if (proj.description?.trim()) {
        font('normal', 8.8);
        setColor(C.label);
        const rawLines = proj.description.trim().split('\n').filter(Boolean);
        rawLines.forEach((raw, bi) => {
          const wrapped = doc.splitTextToSize(raw, CW - 6);
          wrapped.forEach((line: string, i: number) => {
            doc.text((i === 0 ? '—  ' : '    ') + line, ML + 2, y);
            y += SPACE.bulletLine;
          });
          if (bi < rawLines.length - 1) y += SPACE.bulletGap;
        });
      }

      const links: Array<{ label: string; url: string }> = [];
      if (proj.demoUrl)     links.push({ label: 'Live Demo',  url: proj.demoUrl });
      if (proj.githubUrl)   links.push({ label: 'GitHub',     url: proj.githubUrl });
      if (proj.websiteUrl)  links.push({ label: 'Website',    url: proj.websiteUrl });
      if (proj.researchUrl) links.push({ label: 'Research',   url: proj.researchUrl });
      if (links.length) {
        y += 1;
        let lx = ML;
        links.forEach(({ label, url }, i) => {
          if (i > 0) {
            font('normal', 8);
            setColor(C.rule);
            doc.text('   ·   ', lx, y);
            lx += textW('   ·   ');
          }
          hyperlink(label, url, lx, y, C.accent, 8);
          lx += textW(label);
        });
        y += SPACE.metaLine + 0.4;
      }

      entryDivider(idx === (data.projects?.length ?? 0) - 1);
    });
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sectionHeader('Education');

    data.education.forEach((edu, idx) => {
      const achLines = estimateLines(edu.achievements, CW - 4);
      needsPage(10 + achLines * SPACE.metaLine);

      font('bold', 10.5);
      setColor(C.body);
      doc.text(edu.degree || '', ML, y);

      const eduYears = [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – ');
      if (eduYears) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(eduYears, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      if (edu.institution) {
        font('normal', 9);
        setColor(C.label);
        doc.text(edu.institution, ML, y);
        y += SPACE.metaLine;
      }

      const eduMeta = [edu.department, edu.cgpa ? `CGPA ${edu.cgpa}` : undefined].filter(Boolean).join('   ·   ');
      if (eduMeta) {
        font('italic', 8);
        setColor(C.muted);
        doc.text(eduMeta, ML, y);
        y += SPACE.metaLine;
      }

      if (edu.achievements?.trim()) {
        font('normal', 8.3);
        setColor(C.label);
        const wrapped = doc.splitTextToSize(edu.achievements.trim(), CW - 4);
        wrapped.forEach((line: string) => {
          doc.text(line, ML, y);
          y += SPACE.metaLine;
        });
      }

      entryDivider(idx === (data.education?.length ?? 0) - 1);
    });
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    sectionHeader('Skills');
    font('normal', 9.3);
    setColor(C.body);
    const skillStr = data.skills.join('   ·   ');
    const skillLines = doc.splitTextToSize(skillStr, CW);
    skillLines.forEach((line: string) => {
      needsPage(SPACE.paragraphLine);
      doc.text(line, ML, y);
      y += SPACE.paragraphLine;
    });
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sectionHeader('Certifications');

    data.certifications.forEach((cert, idx) => {
      needsPage(13);

      font('bold', 10);
      setColor(C.body);
      doc.text(cert.name || '', ML, y);

      const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
      if (certDate) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(certDate, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      const certMeta = [cert.org, cert.credentialId ? `ID: ${cert.credentialId}` : undefined].filter(Boolean).join('   ·   ');
      if (certMeta) {
        font('normal', 8.5);
        setColor(C.label);
        doc.text(certMeta, ML, y);
        y += SPACE.metaLine;
      }

      if (cert.url) {
        hyperlink('Verify →', cert.url, ML, y, C.accent, 8);
        y += SPACE.metaLine + 0.4;
      }

      entryDivider(idx === (data.certifications?.length ?? 0) - 1);
    });
  }

  // ── Publications ───────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    sectionHeader('Publications');

    data.publications.forEach((pub, idx) => {
      const titleLineCount = estimateLines(pub.title, CW);
      needsPage(7 + titleLineCount * SPACE.metaLine);

      font('bold', 10);
      setColor(C.body);
      const titleLines = doc.splitTextToSize(pub.title || '', CW);
      doc.text(titleLines, ML, y);
      y += titleLines.length * SPACE.metaLine + 0.4;

      const pubMeta = [
        pub.publisher,
        [pub.dateMonth, pub.dateYear].filter(Boolean).join(' '),
        pub.doi ? `DOI: ${pub.doi}` : undefined,
      ].filter(Boolean).join('   ·   ');
      if (pubMeta) {
        font('italic', 8);
        setColor(C.muted);
        doc.text(pubMeta, ML, y);
        y += SPACE.metaLine;
      }

      if (pub.url) {
        hyperlink('Read →', pub.url, ML, y, C.accent, 8);
        y += SPACE.metaLine + 0.4;
      }

      entryDivider(idx === (data.publications?.length ?? 0) - 1);
    });
  }

  // ── Languages ──────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    sectionHeader('Languages');
    font('normal', 9.3);
    setColor(C.body);
    const langStr = data.languages
      .filter(l => l.language)
      .map(l => l.proficiency ? `${l.language} (${l.proficiency})` : l.language)
      .join('   ·   ');
    const langLines = doc.splitTextToSize(langStr, CW);
    langLines.forEach((line: string) => {
      needsPage(SPACE.paragraphLine);
      doc.text(line, ML, y);
      y += SPACE.paragraphLine;
    });
  }

  // ── Awards ─────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    sectionHeader('Awards');

    data.awards.forEach((a, idx) => {
      const descLines = estimateLines(a.description, CW - 4);
      needsPage(10 + descLines * SPACE.metaLine);

      font('bold', 10);
      setColor(C.body);
      doc.text(a.title || '', ML, y);

      if (a.date) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(a.date, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      if (a.issuer) {
        font('italic', 8.3);
        setColor(C.muted);
        doc.text(a.issuer, ML, y);
        y += SPACE.metaLine;
      }

      if (a.description?.trim()) {
        font('normal', 8.8);
        setColor(C.label);
        const wrapped = doc.splitTextToSize(a.description.trim(), CW - 4);
        wrapped.forEach((line: string) => {
          doc.text(line, ML, y);
          y += SPACE.metaLine;
        });
      }

      entryDivider(idx === (data.awards?.length ?? 0) - 1);
    });
  }

  // ── Volunteer ──────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    sectionHeader('Volunteer');

    data.volunteer.forEach((v, idx) => {
      const descLineCount = v.description
        ? v.description.trim().split('\n').filter(Boolean)
            .reduce((sum, raw) => sum + doc.splitTextToSize(raw, CW - 6).length, 0)
        : 0;
      needsPage(10 + (v.org ? SPACE.metaLine : 0) + descLineCount * SPACE.bulletLine);

      font('bold', 10.5);
      setColor(C.body);
      doc.text(v.role || '', ML, y);

      const vDate = formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current);
      if (vDate) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(vDate, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      if (v.org) {
        font('normal', 9);
        setColor(C.label);
        doc.text(v.org, ML, y);
        y += SPACE.metaLine;
      }

      if (v.description?.trim()) {
        font('normal', 8.8);
        setColor(C.label);
        const rawLines = v.description.trim().split('\n').filter(Boolean);
        rawLines.forEach((raw, bi) => {
          const wrapped = doc.splitTextToSize(raw, CW - 6);
          wrapped.forEach((line: string, i: number) => {
            doc.text((i === 0 ? '—  ' : '    ') + line, ML + 2, y);
            y += SPACE.bulletLine;
          });
          if (bi < rawLines.length - 1) y += SPACE.bulletGap;
        });
      }

      entryDivider(idx === (data.volunteer?.length ?? 0) - 1);
    });
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    sectionHeader('Achievements');

    data.achievements.forEach((a, idx) => {
      const descLines = estimateLines(a.description, CW - 4);
      needsPage(9 + descLines * SPACE.metaLine);

      font('bold', 10);
      setColor(C.body);
      doc.text(a.title || '', ML, y);

      if (a.date) {
        font('normal', 8.5);
        setColor(C.muted);
        doc.text(a.date, W - MR, y, { align: 'right' });
      }
      y += SPACE.metaLine + 0.8;

      if (a.description?.trim()) {
        font('normal', 8.8);
        setColor(C.label);
        const wrapped = doc.splitTextToSize(a.description.trim(), CW - 4);
        wrapped.forEach((line: string) => {
          doc.text(line, ML, y);
          y += SPACE.metaLine;
        });
      }

      entryDivider(idx === (data.achievements?.length ?? 0) - 1);
    });
  }

  // ── Page numbers — minimal, bottom right, no marketing footer ─────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    font('normal', 7);
    setColor(C.rule);
    doc.text(`${i} / ${totalPages}`, W - MR, H - 9, { align: 'right' });
  }

  doc.save(`${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume_CFound.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX Generator — C Found Premium v3
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDOCX(data: ProfileData): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
    ExternalHyperlink, Table, TableRow, TableCell, WidthType, VerticalAlign,
    ImageRun, TabStopType,
  } = await import('docx');

  // ── Palette — identical to PDF ─────────────────────────────────────────────
  const HEX = {
    accent:  '2563EB',   // the only color used
    ink:     '0A0A0A',   // name
    body:    '1C1C1C',   // headings / primary text
    label:   '4B4B4B',   // secondary text
    muted:   '919191',   // dates / meta
    rule:    'DEDEDE',   // dividers
  };

  const FONT = 'Calibri';

  // Page geometry — mirrors the PDF's 22mm margins.
  const PAGE_W = 11906;          // A4 width, twips
  const PAGE_H = 16838;          // A4 height, twips
  const MARGIN = 1247;           // ~22mm, twips
  const CONTENT_TWIPS = PAGE_W - MARGIN * 2; // exact right-tab anchor — fixes
                                              // the date-misalignment issue
                                              // in the previous version.

  const PHOTO_BOX_MM = 30;
  const PHOTO_GAP_MM = 8;
  const MM_TO_TWIPS = 56.6929;
  const MM_TO_PX = 3.7795; // for ImageRun, which sizes in pixels

  // ── Helpers ────────────────────────────────────────────────────────────────

  const run = (
    text: string,
    opts: {
      bold?: boolean;
      italic?: boolean;
      size?: number;
      color?: string;
      underline?: boolean;
    } = {}
  ) =>
    new TextRun({
      text,
      bold:      opts.bold    ?? false,
      italics:   opts.italic  ?? false,
      size:      opts.size    ?? 20,
      color:     opts.color   ?? HEX.body,
      font:      FONT,
      underline: opts.underline ? {} : undefined,
    });

  const link = (label: string, url: string, size = 18) =>
    new ExternalHyperlink({
      link: url,
      children: [run(label, { color: HEX.accent, underline: true, size })],
    });

  const para = (
    children: any[],
    opts: {
      before?: number;
      after?: number;
      indent?: number;
      align?: typeof AlignmentType[keyof typeof AlignmentType];
    } = {}
  ) =>
    new Paragraph({
      alignment:  opts.align,
      spacing:    { before: opts.before ?? 0, after: opts.after ?? 40 },
      indent:     opts.indent ? { left: opts.indent } : undefined,
      children,
    });

  const hRule = () =>
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: HEX.rule, space: 1 },
      },
      spacing: { before: 60, after: 60 },
      children: [],
    });

  const gap = (sz = 80) => new Paragraph({ spacing: { before: sz, after: 0 }, children: [] });

  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 320, after: 110 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: HEX.rule, space: 2 },
      },
      children: [run(title.toUpperCase(), { bold: true, size: 15, color: HEX.muted })],
    });

  // Row helper: bold left label + right-aligned muted date, via a tab stop
  // anchored at the true content width — keeps every date column flush
  // with the right margin regardless of label length.
  const titleDateRow = (label: string, date: string | undefined, size: number, before: number) => {
    const r: any[] = [run(label, { bold: true, size, color: HEX.body })];
    if (date) r.push(run(`\t${date}`, { size: size - 2, color: HEX.muted }));
    return new Paragraph({
      spacing: { before, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_TWIPS }],
      children: r,
    });
  };

  // ── Build content ──────────────────────────────────────────────────────────
  const bodyChildren: any[] = [];

  // ── Header: photo LEFT in a borderless table, text block to its right ─────
  const usePhoto = isImageKitPhoto(data.photoURL);
  let photoImgData: string | null = null;
  let photoDims: { width: number; height: number } | null = null;

  if (usePhoto && data.photoURL) {
    try {
      const photoUrl = `${data.photoURL}?tr=w-400,h-400,c-at_max,f-jpg,q-95`;
      photoImgData = await fetchImageAsBase64(photoUrl);
      if (photoImgData) photoDims = await loadImageDimensions(photoImgData);
    } catch {
      photoImgData = null;
    }
  }

  const hasPhoto = !!(photoImgData && photoDims);

  // Build the name / title / contact / links stack — reused in both the
  // photo and no-photo layouts so spacing/typography stay identical.
  const buildHeaderTextBlock = (): Paragraph[] => {
    const block: Paragraph[] = [];

    block.push(para([run(data.displayName || '', { bold: true, size: 50, color: HEX.ink })], { after: 70 }));

    const currentExp = data.experiences?.find((e) => e.current) ?? data.experiences?.[0];

    const roleText = currentExp?.role || "";
    const companyText = currentExp?.company || "";
    if (roleText) {
      block.push(
        para([run(roleText, {
          bold: true,
          size: 22,
          color: HEX.accent,
        })], {
          after: 30,
        })
      );
    }

    if (companyText) {
      block.push(
        para([run(companyText, {
          size: 19,
          color: HEX.label,
        })], {
          after: 70,
        })
      );
    }

    const contactRuns: any[] = [];
    if (data.email) contactRuns.push(link(data.email, `mailto:${data.email}`, 18));
    if (data.phone) {
      if (contactRuns.length) contactRuns.push(run('   ·   ', { color: HEX.rule, size: 18 }));
      contactRuns.push(link(data.phone, `tel:${data.phone}`, 18));
    }
    const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
    if (loc) {
      if (contactRuns.length) contactRuns.push(run('   ·   ', { color: HEX.rule, size: 18 }));
      contactRuns.push(run(loc, { color: HEX.muted, size: 18 }));
    }
    if (contactRuns.length) {
      block.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: contactRuns }));
    }

    const profLinks: Array<{ label: string; url: string }> = [
      data.linkedinUrl      && { label: 'LinkedIn',       url: data.linkedinUrl },
      data.githubUrl        && { label: 'GitHub',         url: data.githubUrl },
      data.portfolioUrl     && { label: 'Portfolio',      url: data.portfolioUrl },
      data.twitterUrl       && { label: 'X',              url: data.twitterUrl },
      data.behanceUrl       && { label: 'Behance',        url: data.behanceUrl },
      data.dribbbleUrl      && { label: 'Dribbble',       url: data.dribbbleUrl },
      data.youtubeUrl       && { label: 'YouTube',        url: data.youtubeUrl },
      data.mediumUrl        && { label: 'Medium',         url: data.mediumUrl },
      data.kaggleUrl        && { label: 'Kaggle',         url: data.kaggleUrl },
      data.researchgateUrl  && { label: 'ResearchGate',   url: data.researchgateUrl },
      data.scholarUrl       && { label: 'Google Scholar', url: data.scholarUrl },
      data.stackoverflowUrl && { label: 'Stack Overflow', url: data.stackoverflowUrl },
      data.otherUrl         && { label: linkMeta(data.otherUrl).label, url: data.otherUrl },
    ].filter(Boolean) as Array<{ label: string; url: string }>;

    if (profLinks.length) {
      const linkRuns: any[] = [];
      profLinks.forEach(({ label, url }, i) => {
        if (i > 0) linkRuns.push(run('   ·   ', { color: HEX.rule, size: 17 }));
        linkRuns.push(link(label, url, 17));
      });
      block.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: linkRuns }));
    }

    return block;
  };

  if (hasPhoto && photoImgData && photoDims) {
    const boxPx = PHOTO_BOX_MM * MM_TO_PX;
    const { drawW, drawH } = containFit(boxPx, boxPx, photoDims.width, photoDims.height);

    // Strip the data: prefix → raw base64 → Uint8Array, as docx's ImageRun expects binary data.
    const base64Data = photoImgData.split(',')[1] || '';
    const binary = typeof atob !== 'undefined'
      ? Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      : new Uint8Array(Buffer.from(base64Data, 'base64'));

    const photoCell = new TableCell({
      width: { size: Math.round(PHOTO_BOX_MM * MM_TO_TWIPS) + Math.round(PHOTO_GAP_MM * MM_TO_TWIPS), type: WidthType.DXA },
      verticalAlign: VerticalAlign.TOP,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: binary,
              transformation: { width: Math.round(drawW), height: Math.round(drawH) },
              type: 'jpg',
            }),
          ],
        }),
      ],
    });

    const textCell = new TableCell({
      width: { size: CONTENT_TWIPS - (Math.round(PHOTO_BOX_MM * MM_TO_TWIPS) + Math.round(PHOTO_GAP_MM * MM_TO_TWIPS)), type: WidthType.DXA },
      verticalAlign: VerticalAlign.TOP,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      children: buildHeaderTextBlock(),
    });

    bodyChildren.push(
      new Table({
        width: { size: CONTENT_TWIPS, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [new TableRow({ children: [photoCell, textCell] })],
      })
    );
    bodyChildren.push(gap(60));
  } else {
    bodyChildren.push(...buildHeaderTextBlock());
  }

  // Header divider
  bodyChildren.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: HEX.rule, space: 1 } },
      spacing: { before: 100, after: 80 },
      children: [],
    })
  );

  // ── Summary ────────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    bodyChildren.push(sectionTitle('Summary'));
    data.bio.trim().split('\n').filter(Boolean).forEach(line => {
      bodyChildren.push(para([run(line, { size: 20, color: HEX.label })], { before: 20, after: 20 }));
    });
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    bodyChildren.push(sectionTitle('Experience'));

    data.experiences.forEach((exp: ExperienceItem, idx: number) => {
      const dateStr = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      bodyChildren.push(titleDateRow(exp.role || '', dateStr, 22, idx === 0 ? 60 : 140));

      const companyParts = [exp.company, exp.type, exp.mode].filter(Boolean);
      if (companyParts.length) {
        bodyChildren.push(para([run(companyParts.join('  ·  '), { size: 19, color: HEX.label })], { after: 20 }));
      }

      if (exp.location) {
        bodyChildren.push(para([run(exp.location, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      }

      if (exp.skills?.trim()) {
        const skillList = exp.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean).join('  ·  ');
        bodyChildren.push(para([run(skillList, { size: 17, color: HEX.accent })], { before: 10, after: 20 }));
      }

      if (exp.description?.trim()) {
        exp.description.trim().split('\n').filter(Boolean).forEach(line => {
          bodyChildren.push(
            para([run(`—  ${line}`, { size: 19, color: HEX.label })], { before: 10, after: 10, indent: 180 })
          );
        });
      }

      if (idx < (data.experiences?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    bodyChildren.push(sectionTitle('Projects'));

    data.projects.forEach((proj: ProjectItem, idx: number) => {
      const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      bodyChildren.push(titleDateRow(proj.title || '', projDate, 22, idx === 0 ? 60 : 140));

      if (proj.category) {
        bodyChildren.push(para([run(proj.category, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      }

      if (proj.technologies?.trim()) {
        bodyChildren.push(para([run(proj.technologies, { size: 17, color: HEX.accent })], { before: 10, after: 20 }));
      }

      if (proj.description?.trim()) {
        proj.description.trim().split('\n').filter(Boolean).forEach(line => {
          bodyChildren.push(
            para([run(`—  ${line}`, { size: 19, color: HEX.label })], { before: 10, after: 10, indent: 180 })
          );
        });
      }

      const linkRuns: any[] = [];
      if (proj.demoUrl)     { linkRuns.push(link('Live Demo', proj.demoUrl)); }
      if (proj.githubUrl)   { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.rule, size: 17 })); linkRuns.push(link('GitHub', proj.githubUrl)); }
      if (proj.websiteUrl)  { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.rule, size: 17 })); linkRuns.push(link('Website', proj.websiteUrl)); }
      if (proj.researchUrl) { if (linkRuns.length) linkRuns.push(run('   ·   ', { color: HEX.rule, size: 17 })); linkRuns.push(link('Research', proj.researchUrl)); }
      if (linkRuns.length) {
        bodyChildren.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: linkRuns }));
      }

      if (idx < (data.projects?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    bodyChildren.push(sectionTitle('Education'));

    data.education.forEach((edu: EducationItem, idx: number) => {
      const eduYears = [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – ');
      bodyChildren.push(titleDateRow(edu.degree || '', eduYears, 22, idx === 0 ? 60 : 140));

      if (edu.institution) {
        bodyChildren.push(para([run(edu.institution, { size: 19, color: HEX.label })], { after: 20 }));
      }

      const eduMeta = [edu.department, edu.cgpa ? `CGPA ${edu.cgpa}` : undefined].filter(Boolean).join('  ·  ');
      if (eduMeta) {
        bodyChildren.push(para([run(eduMeta, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      }

      if (edu.achievements?.trim()) {
        bodyChildren.push(para([run(edu.achievements.trim(), { size: 18, color: HEX.label })], { before: 10, after: 20 }));
      }

      if (idx < (data.education?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    bodyChildren.push(sectionTitle('Skills'));
    bodyChildren.push(
      para([run(data.skills.join('   ·   '), { size: 20, color: HEX.body })], { before: 20, after: 20 })
    );
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    bodyChildren.push(sectionTitle('Certifications'));

    data.certifications.forEach((cert: CertificationItem, idx: number) => {
      const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
      bodyChildren.push(titleDateRow(cert.name || '', certDate, 20, idx === 0 ? 60 : 120));

      const certMeta = [cert.org, cert.credentialId ? `ID: ${cert.credentialId}` : undefined].filter(Boolean).join('   ·   ');
      if (certMeta) {
        bodyChildren.push(para([run(certMeta, { size: 17, color: HEX.label })], { after: 20 }));
      }

      if (cert.url) {
        bodyChildren.push(new Paragraph({ spacing: { before: 10, after: 20 }, children: [link('Verify →', cert.url)] }));
      }

      if (idx < (data.certifications?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Publications ───────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    bodyChildren.push(sectionTitle('Publications'));

    data.publications.forEach((pub: PublicationItem, idx: number) => {
      bodyChildren.push(
        para([run(pub.title || '', { bold: true, size: 20, color: HEX.body })], { before: idx === 0 ? 60 : 120, after: 20 })
      );

      const pubMeta = [
        pub.publisher,
        [pub.dateMonth, pub.dateYear].filter(Boolean).join(' '),
        pub.doi ? `DOI: ${pub.doi}` : undefined,
      ].filter(Boolean).join('   ·   ');
      if (pubMeta) {
        bodyChildren.push(para([run(pubMeta, { italic: true, size: 16, color: HEX.muted })], { after: 20 }));
      }

      if (pub.url) {
        bodyChildren.push(new Paragraph({ spacing: { before: 10, after: 20 }, children: [link('Read →', pub.url)] }));
      }

      if (idx < (data.publications?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Languages ──────────────────────────────────────────────────────────────
  if (data.languages && data.languages.length > 0) {
    bodyChildren.push(sectionTitle('Languages'));
    const langRuns: any[] = [];
    data.languages
      .filter(l => l.language)
      .forEach(({ language, proficiency }, i) => {
        if (i > 0) langRuns.push(run('   ·   ', { color: HEX.rule, size: 19 }));
        langRuns.push(run(language!, { bold: true, size: 20, color: HEX.body }));
        if (proficiency) langRuns.push(run(`  (${proficiency})`, { size: 18, color: HEX.label }));
      });
    if (langRuns.length) {
      bodyChildren.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: langRuns }));
    }
  }

  // ── Awards ─────────────────────────────────────────────────────────────────
  if (data.awards && data.awards.length > 0) {
    bodyChildren.push(sectionTitle('Awards'));

    data.awards.forEach((a: AwardItem, idx: number) => {
      bodyChildren.push(titleDateRow(a.title || '', a.date, 20, idx === 0 ? 60 : 120));

      if (a.issuer) {
        bodyChildren.push(para([run(a.issuer, { italic: true, size: 17, color: HEX.muted })], { after: 20 }));
      }

      if (a.description) {
        bodyChildren.push(para([run(a.description, { size: 18, color: HEX.label })], { after: 20 }));
      }

      if (idx < (data.awards?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Volunteer ──────────────────────────────────────────────────────────────
  if (data.volunteer && data.volunteer.length > 0) {
    bodyChildren.push(sectionTitle('Volunteer'));

    data.volunteer.forEach((v: VolunteerItem, idx: number) => {
      const vDate = formatDateRange(v.startMonth, v.startYear, v.endMonth, v.endYear, v.current);
      bodyChildren.push(titleDateRow(v.role || '', vDate, 20, idx === 0 ? 60 : 120));

      if (v.org) {
        bodyChildren.push(para([run(v.org, { size: 18, color: HEX.label })], { after: 20 }));
      }

      if (v.description?.trim()) {
        v.description.trim().split('\n').filter(Boolean).forEach(line => {
          bodyChildren.push(
            para([run(`—  ${line}`, { size: 19, color: HEX.label })], { before: 10, after: 10, indent: 180 })
          );
        });
      }

      if (idx < (data.volunteer?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (data.achievements && data.achievements.length > 0) {
    bodyChildren.push(sectionTitle('Achievements'));

    data.achievements.forEach((a: AchievementItem, idx: number) => {
      bodyChildren.push(titleDateRow(a.title || '', a.date, 20, idx === 0 ? 60 : 120));

      if (a.description) {
        bodyChildren.push(para([run(a.description, { size: 18, color: HEX.label })], { after: 20 }));
      }

      if (idx < (data.achievements?.length ?? 0) - 1) bodyChildren.push(hRule());
    });
  }

  // ── Assemble document ──────────────────────────────────────────────────────
  const docxDocument = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 20, color: HEX.body } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size:   { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: bodyChildren,
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