// resumeBuilder.ts — Premium resume generator (PDF + DOCX)
// Generates from profile data exactly as entered. No AI rewriting.

// ── PDF generation (jsPDF - pure text, selectable, ATS-friendly) ─────────────

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
  otherUrl?: string;
  experiences?: any[];
  projects?: any[];
  education?: any[];
  certifications?: any[];
  publications?: any[];
}

function isImageKitPhoto(url?: string | null): boolean {
  if (!url) return false;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return false;
  return url.startsWith(endpoint);
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function generatePDF(data: ProfileData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width mm
  const H = 297;
  const ML = 20; // left margin
  const MR = 20; // right margin
  const CW = W - ML - MR; // content width
  let y = 0;

  // ── Colors ──────────────────────────────────────────────────────────────
  const BLUE = [37, 99, 235] as [number, number, number];   // #2563EB
  const DARK = [17, 24, 39] as [number, number, number];    // #111827
  const MID  = [75, 85, 99] as [number, number, number];    // #4B5563
  const LIGHT= [156, 163, 175] as [number, number, number]; // #9CA3AF
  const BG   = [249, 250, 251] as [number, number, number]; // #F9FAFB
  const DIV  = [229, 231, 235] as [number, number, number]; // #E5E7EB

  // ── Helpers ─────────────────────────────────────────────────────────────

  const pageBreakIfNeeded = (needed: number) => {
    if (y + needed > H - 15) {
      doc.addPage();
      y = 15;
    }
  };

  const setColor = (rgb: [number, number, number]) =>
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const setFillColor = (rgb: [number, number, number]) =>
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const drawDivider = (yPos: number, color: [number, number, number] = DIV) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(ML, yPos, W - MR, yPos);
  };

  const sectionHeader = (title: string) => {
    pageBreakIfNeeded(14);
    y += 7;
    setColor(BLUE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title.toUpperCase(), ML, y);
    // underline accent
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.8);
    doc.line(ML, y + 1.5, ML + doc.getTextWidth(title.toUpperCase()), y + 1.5);
    drawDivider(y + 2.5, DIV);
    y += 7;
  };

  const dateRange = (startMonth?: string, startYear?: string, endMonth?: string, endYear?: string, current?: boolean) => {
    const start = [startMonth, startYear].filter(Boolean).join(' ');
    const end = current ? 'Present' : [endMonth, endYear].filter(Boolean).join(' ');
    if (!start && !end) return '';
    if (!start) return end;
    if (!end) return start;
    return `${start} – ${end}`;
  };

  // ── HEADER BLOCK ─────────────────────────────────────────────────────────

  // Photo (only ImageKit)
  let photoHeight = 0;
  const usePhoto = isImageKitPhoto(data.photoURL);

  // Top header background
  setFillColor([248, 249, 255]);
  doc.rect(0, 0, W, 55, 'F');

  y = 18;

  if (usePhoto) {
    // We'll fetch the image as base64 and embed it
    try {
      const photoUrl = `${data.photoURL}?tr=w-200,h-200,c-at_max,f-jpg,q-95`;
      const imgData = await fetchImageAsBase64(photoUrl);
      if (imgData) {
        const imgSize = 28;
        doc.addImage(imgData, 'JPEG', ML, y - 5, imgSize, imgSize, undefined, 'FAST');
        // Info offset to the right of photo
        const infoX = ML + imgSize + 6;
        renderHeaderInfo(infoX, W - MR - infoX);
        y = Math.max(y + imgSize + 3, y + 30);
        photoHeight = imgSize;
      } else {
        renderHeaderInfo(ML, CW);
        y += 30;
      }
    } catch {
      renderHeaderInfo(ML, CW);
      y += 30;
    }
  } else {
    renderHeaderInfo(ML, CW);
    y += 30;
  }

  function renderHeaderInfo(x: number, w: number) {
    let hy = y;

    // Name
    setColor(DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(data.displayName || 'Name', x, hy);
    hy += 7;

    // Role
    setColor(BLUE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
    doc.text(roleText, x, hy);
    hy += 5.5;

    // Contact line
    setColor(MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const contacts: string[] = [];
    if (data.email) contacts.push(data.email);
    if (data.phone) contacts.push(data.phone);
    if (data.city || data.country) contacts.push([data.city, data.country].filter(Boolean).join(', '));
    doc.text(contacts.join('   |   '), x, hy);
    hy += 4.5;

    // Links
    const links: string[] = [];
    if (data.portfolioUrl) links.push(data.portfolioUrl);
    if (data.githubUrl) links.push(data.githubUrl);
    if (data.linkedinUrl) links.push(data.linkedinUrl);
    if (links.length > 0) {
      setColor(BLUE);
      doc.setFontSize(7.5);
      const linkText = links.join('   ·   ');
      const wrapped = doc.splitTextToSize(linkText, w);
      doc.text(wrapped, x, hy);
      hy += wrapped.length * 4;
    }

    y = hy;
  }

  // Divider below header
  y += 3;
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(1);
  doc.line(ML, y, W - MR, y);
  y += 6;

  // ── ABOUT ME ─────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    sectionHeader('About Me');
    setColor(MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const bioLines = doc.splitTextToSize(data.bio.trim(), CW);
    bioLines.forEach((line: string) => {
      pageBreakIfNeeded(5);
      doc.text(line, ML, y);
      y += 4.8;
    });
  }

  // ── SKILLS ────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    sectionHeader('Skills');
    // Render as wrapped chips (text labels)
    const skillStr = data.skills.join('  ·  ');
    setColor(DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const skillLines = doc.splitTextToSize(skillStr, CW);
    skillLines.forEach((line: string) => {
      pageBreakIfNeeded(5);
      doc.text(line, ML, y);
      y += 5;
    });
  }

  // ── EXPERIENCE ───────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    sectionHeader('Experience');
    data.experiences.forEach((exp: any) => {
      pageBreakIfNeeded(22);
      // Role + Company
      setColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(exp.role || '', ML, y);

      // Company right-aligned
      setColor(MID);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const companyStr = [exp.company, exp.type].filter(Boolean).join(' · ');
      doc.text(companyStr, W - MR, y, { align: 'right' });
      y += 5;

      // Date + location
      setColor(LIGHT);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const expDate = dateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      const locStr = [expDate, exp.location, exp.mode].filter(Boolean).join('  ·  ');
      doc.text(locStr, ML, y);
      y += 5;

      // Skills used
      if (exp.skills?.trim()) {
        setColor(BLUE);
        doc.setFontSize(7.5);
        doc.text(exp.skills, ML, y);
        y += 4.5;
      }

      // Description
      if (exp.description?.trim()) {
        setColor(MID);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(exp.description.trim(), CW - 3);
        lines.forEach((line: string) => {
          pageBreakIfNeeded(5);
          doc.text('•  ' + line, ML + 2, y);
          y += 4.5;
        });
      }

      y += 4;
      drawDivider(y - 2, [243, 244, 246]);
    });
  }

  // ── PROJECTS ─────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    sectionHeader('Projects');
    data.projects.forEach((proj: any) => {
      pageBreakIfNeeded(20);
      setColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(proj.title || '', ML, y);

      // Status right
      setColor(BLUE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(proj.status || '', W - MR, y, { align: 'right' });
      y += 5;

      // Category + date
      setColor(LIGHT);
      doc.setFontSize(7.5);
      const projDate = dateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      const projMeta = [proj.category, projDate].filter(Boolean).join('  ·  ');
      if (projMeta) { doc.text(projMeta, ML, y); y += 4.5; }

      // Tech stack
      if (proj.technologies?.trim()) {
        setColor(BLUE);
        doc.setFontSize(7.5);
        doc.text(proj.technologies, ML, y);
        y += 4.5;
      }

      // Description
      if (proj.description?.trim()) {
        setColor(MID);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(proj.description.trim(), CW - 3);
        lines.forEach((line: string) => {
          pageBreakIfNeeded(5);
          doc.text('•  ' + line, ML + 2, y);
          y += 4.5;
        });
      }

      // Links
      const projLinks = [proj.demoUrl, proj.githubUrl].filter(Boolean);
      if (projLinks.length > 0) {
        setColor(BLUE);
        doc.setFontSize(7.5);
        doc.text(projLinks.join('   ·   '), ML, y);
        y += 4.5;
      }

      y += 4;
      drawDivider(y - 2, [243, 244, 246]);
    });
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sectionHeader('Education');
    data.education.forEach((edu: any) => {
      pageBreakIfNeeded(16);
      setColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(edu.degree || '', ML, y);

      setColor(MID);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(edu.institution || '', W - MR, y, { align: 'right' });
      y += 5;

      setColor(LIGHT);
      doc.setFontSize(8);
      const eduMeta = [
        edu.department,
        [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – '),
      ].filter(Boolean).join('  ·  ');
      if (eduMeta) { doc.text(eduMeta, ML, y); y += 5; }
      y += 2;
    });
  }

  // ── CERTIFICATIONS ───────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sectionHeader('Certifications');
    data.certifications.forEach((cert: any) => {
      pageBreakIfNeeded(12);
      setColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(cert.name || '', ML, y);

      setColor(MID);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(cert.org || '', W - MR, y, { align: 'right' });
      y += 5;

      setColor(LIGHT);
      doc.setFontSize(7.5);
      const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
      if (certDate) { doc.text(certDate, ML, y); y += 4.5; }

      if (cert.url) {
        setColor(BLUE);
        doc.setFontSize(7.5);
        doc.text(cert.url, ML, y);
        y += 4.5;
      }
      y += 2;
    });
  }

  // ── PUBLICATIONS ─────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    sectionHeader('Publications');
    data.publications.forEach((pub: any) => {
      pageBreakIfNeeded(12);
      setColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const pubLines = doc.splitTextToSize(pub.title || '', CW);
      doc.text(pubLines, ML, y);
      y += pubLines.length * 5;

      setColor(MID);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const pubMeta = [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ');
      if (pubMeta) { doc.text(pubMeta, ML, y); y += 4.5; }

      if (pub.url) {
        setColor(BLUE);
        doc.setFontSize(7.5);
        doc.text(pub.url, ML, y);
        y += 4.5;
      }
      y += 2;
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setColor(LIGHT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${data.displayName || ''} · Resume`, ML, H - 8);
    doc.text(`${i} / ${totalPages}`, W - MR, H - 8, { align: 'right' });
    doc.setDrawColor(DIV[0], DIV[1], DIV[2]);
    doc.setLineWidth(0.3);
    doc.line(ML, H - 11, W - MR, H - 11);
  }

  doc.save(`${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`);
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

// ── DOCX ──────────────────────────────────────────────────────────────────────

export async function generateDOCX(data: ProfileData): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
    BorderStyle, LevelFormat, Table, TableRow, TableCell, WidthType, ShadingType,
    VerticalAlign,
  } = await import('docx');

  const BLUE_HEX = '2563EB';
  const DARK_HEX = '111827';
  const MID_HEX = '4B5563';
  const LIGHT_HEX = '9CA3AF';

  const children: any[] = [];

  // ── Helper factories ──────────────────────────────────────────────────────

  const sectionDivider = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_HEX, space: 1 } },
      spacing: { before: 60, after: 60 },
      children: [],
    });

  const lightDivider = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 1 } },
      spacing: { before: 40, after: 40 },
      children: [],
    });

  const sectionTitle = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 18,
          color: BLUE_HEX,
          font: 'Calibri',
        }),
      ],
    });

  const boldLabel = (text: string, right?: string) =>
    new Paragraph({
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({ text, bold: true, size: 20, color: DARK_HEX, font: 'Calibri' }),
        ...(right ? [new TextRun({ text: `   · ${right}`, size: 18, color: MID_HEX, font: 'Calibri' })] : []),
      ],
    });

  const metaLine = (text: string) =>
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text, size: 16, color: LIGHT_HEX, font: 'Calibri', italics: true })],
    });

  const bodyText = (text: string) =>
    new Paragraph({
      spacing: { before: 20, after: 20 },
      indent: { left: 200 },
      children: [new TextRun({ text: `• ${text}`, size: 18, color: MID_HEX, font: 'Calibri' })],
    });

  const linkText = (text: string) =>
    new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [new TextRun({ text, size: 16, color: BLUE_HEX, font: 'Calibri' })],
    });

  const emptyLine = (size = 40) =>
    new Paragraph({ spacing: { before: size, after: 0 }, children: [] });

  // ── HEADER ────────────────────────────────────────────────────────────────

  // Name
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: data.displayName || '',
          bold: true,
          size: 44,
          color: DARK_HEX,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Role
  const roleText = [data.primaryRole, data.secondaryRole].filter(Boolean).join('  ·  ');
  if (roleText) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: roleText, bold: true, size: 22, color: BLUE_HEX, font: 'Calibri' })],
      })
    );
  }

  // Contact
  const contacts = [
    data.email,
    data.phone,
    [data.city, data.country].filter(Boolean).join(', '),
  ].filter(Boolean);
  if (contacts.length) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: contacts.join('   |   '), size: 18, color: MID_HEX, font: 'Calibri' })],
      })
    );
  }

  // Links
  const links = [data.portfolioUrl, data.githubUrl, data.linkedinUrl, data.otherUrl].filter(Boolean) as string[];
  if (links.length) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: links.join('   ·   '), size: 16, color: BLUE_HEX, font: 'Calibri' })],
      })
    );
  }

  // If no photo included, note
  if (!isImageKitPhoto(data.photoURL)) {
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 80 },
        children: [
          new TextRun({
            text: 'Note: Upload a custom profile photo to include a high-quality image in your resume.',
            size: 16,
            color: LIGHT_HEX,
            italics: true,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  children.push(sectionDivider());

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  if (data.bio?.trim()) {
    children.push(sectionTitle('About Me'));
    const bioParts = data.bio.trim().split('\n').filter(Boolean);
    bioParts.forEach((line) => {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: line, size: 18, color: MID_HEX, font: 'Calibri' })],
        })
      );
    });
    children.push(emptyLine(60));
  }

  // ── SKILLS ────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    children.push(sectionTitle('Skills'));
    children.push(
      new Paragraph({
        spacing: { before: 20, after: 60 },
        children: [
          new TextRun({ text: data.skills.join('   ·   '), size: 18, color: DARK_HEX, font: 'Calibri' }),
        ],
      })
    );
  }

  // ── EXPERIENCE ────────────────────────────────────────────────────────────
  if (data.experiences && data.experiences.length > 0) {
    children.push(sectionTitle('Experience'));
    data.experiences.forEach((exp: any) => {
      children.push(boldLabel(exp.role || '', [exp.company, exp.type].filter(Boolean).join(' · ')));

      const expDate = formatDateRange(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.current);
      const locStr = [expDate, exp.location, exp.mode].filter(Boolean).join('  ·  ');
      if (locStr) children.push(metaLine(locStr));

      if (exp.skills?.trim()) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: `Skills: ${exp.skills}`, size: 16, color: BLUE_HEX, font: 'Calibri' })],
          })
        );
      }

      if (exp.description?.trim()) {
        exp.description.trim().split('\n').filter(Boolean).forEach((line: string) => {
          children.push(bodyText(line));
        });
      }

      children.push(lightDivider());
    });
  }

  // ── PROJECTS ─────────────────────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    children.push(sectionTitle('Projects'));
    data.projects.forEach((proj: any) => {
      children.push(boldLabel(proj.title || '', proj.status));
      const projDate = formatDateRange(proj.startMonth, proj.startYear, proj.endMonth, proj.endYear);
      const projMeta = [proj.category, projDate].filter(Boolean).join('  ·  ');
      if (projMeta) children.push(metaLine(projMeta));
      if (proj.technologies?.trim()) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: `Tech: ${proj.technologies}`, size: 16, color: BLUE_HEX, font: 'Calibri' })],
          })
        );
      }
      if (proj.description?.trim()) {
        proj.description.trim().split('\n').filter(Boolean).forEach((line: string) => {
          children.push(bodyText(line));
        });
      }
      const projLinks = [proj.demoUrl, proj.githubUrl].filter(Boolean);
      if (projLinks.length) children.push(linkText(projLinks.join('   ·   ')));
      children.push(lightDivider());
    });
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    children.push(sectionTitle('Education'));
    data.education.forEach((edu: any) => {
      children.push(boldLabel(edu.degree || '', edu.institution));
      const eduMeta = [
        edu.department,
        [edu.startYear, edu.current ? 'Present' : edu.endYear].filter(Boolean).join(' – '),
      ].filter(Boolean).join('  ·  ');
      if (eduMeta) children.push(metaLine(eduMeta));
      children.push(emptyLine(40));
    });
  }

  // ── CERTIFICATIONS ───────────────────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    children.push(sectionTitle('Certifications'));
    data.certifications.forEach((cert: any) => {
      children.push(boldLabel(cert.name || '', cert.org));
      const certDate = [cert.issueMonth, cert.issueYear].filter(Boolean).join(' ');
      if (certDate) children.push(metaLine(certDate));
      if (cert.url) children.push(linkText(cert.url));
      children.push(emptyLine(40));
    });
  }

  // ── PUBLICATIONS ─────────────────────────────────────────────────────────
  if (data.publications && data.publications.length > 0) {
    children.push(sectionTitle('Publications'));
    data.publications.forEach((pub: any) => {
      children.push(boldLabel(pub.title || ''));
      const pubMeta = [pub.publisher, [pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ');
      if (pubMeta) children.push(metaLine(pubMeta));
      if (pub.url) children.push(linkText(pub.url));
      children.push(emptyLine(40));
    });
  }

  // ── Build document ────────────────────────────────────────────────────────

  const document = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 18 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // ~0.75 inch
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement?.('a') || Object.assign(globalThis.document.createElement('a'), {});
  // Use native DOM
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${(data.displayName || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;
  window.document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
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