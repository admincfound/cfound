export function getProfileCompletion(profile: any) {
  if (!profile) return { isComplete: false, percentage: 0, missing: ['Profile not initialized'], suggestions: [], strength: 'Weak' };

  const isFresher = profile.experienceLevel === 'Fresher';

  const basicFields = [
    { field: 'displayName', name: 'Full Name' },
    { field: 'phone', name: 'Phone Number' },
    { field: 'country', name: 'Country' },
    { field: 'city', name: 'City' },
    { field: 'bio', name: 'Bio/About' },
    { field: 'primaryRole', name: 'Primary Role/Interest' }
  ];

  const missing: string[] = [];
  const suggestions: string[] = [];

  let percentage = 0;

  // Basic Info Check
  let basicCompletedCount = 0;
  basicFields.forEach(req => {
    if (!profile[req.field] || (typeof profile[req.field] === 'string' && profile[req.field].trim() === '')) {
      missing.push(req.name);
    } else {
      basicCompletedCount++;
    }
  });

  // Calculate Basic Info percentage based on experience level
  if (isFresher) {
    percentage += (basicCompletedCount / basicFields.length) * 40;
  } else {
    percentage += (basicCompletedCount / basicFields.length) * 20;
  }

  // Skills Check
  const skills = Array.isArray(profile.skills) ? profile.skills.filter(s => typeof s === 'string' && s.trim() !== '') : (typeof profile.skills === 'string' ? profile.skills.split(',').filter((s: string) => s.trim()) : []);
  if (skills.length < 1) {
    missing.push('Skills (At least 1 required)');
  } else {
    percentage += isFresher ? 20 : 10;
  }

  // Education Check
  const validEducation = profile.education?.some(
    (edu: any) =>
      edu.institution && typeof edu.institution === 'string' && edu.institution.trim() !== '' &&
      edu.degree && typeof edu.degree === 'string' && edu.degree.trim() !== '' &&
      edu.department && typeof edu.department === 'string' && edu.department.trim() !== '' &&
      edu.startYear && typeof edu.startYear === 'string' && edu.startYear.trim() !== '' &&
      !edu.institution.includes('University of Technology') &&
      !edu.degree.includes('Bachelor of Science') &&
      !edu.department.includes('Computer Science')
  ) || false;

  if (!validEducation) {
    missing.push('Education details required');
  } else {
    percentage += isFresher ? 25 : 20;
  }

  // Declaration & Signature Checks
  let hasDeclAndSig = 0;
  if (!profile.declarationAccepted) {
    missing.push('Declaration & Consent (Checkbox)');
  } else {
    hasDeclAndSig++;
  }

  if (!profile.signature || typeof profile.signature !== 'string' || profile.signature.trim() === '') {
    missing.push('Digital Signature');
  } else {
    hasDeclAndSig++;
  }

  percentage += isFresher ? (hasDeclAndSig / 2) * 15 : (hasDeclAndSig / 2) * 15;

  // Experience Check
  const validExperience = profile.experiences?.some(
    (exp: any) =>
      exp.role && typeof exp.role === 'string' && exp.role.trim() !== '' &&
      exp.company && typeof exp.company === 'string' && exp.company.trim() !== '' &&
      exp.type && typeof exp.type === 'string' && exp.type.trim() !== '' &&
      exp.startYear && typeof exp.startYear === 'string' && exp.startYear.trim() !== '' &&
      exp.description && typeof exp.description === 'string' && exp.description.trim() !== '' &&
      !exp.company.includes('Tech Corp') &&
      !exp.role.includes('Software Engineer')
  ) || false;

  if (!isFresher) {
    if (!validExperience) {
      missing.push('Work experience required');
    } else {
      percentage += 35;
    }
  }

  // Projects Check (Always Optional/Suggestion)
  const hasValidProjects = profile.projects?.some(
    (p: any) => 
      p.title && typeof p.title === 'string' && p.title.trim() !== '' && 
      !p.title.includes('E-commerce Platform')
  ) || false;

  if (!hasValidProjects) {
    suggestions.push('Add personal or college projects to strengthen your profile.');
  }

  if (isFresher && !validExperience) {
    suggestions.push('Add experience (like internships) to stand out.');
  }

  // Suggest other things
  const hasCertifications = profile.certifications?.some((c: any) => c.name && typeof c.name === 'string' && c.name.trim() !== '') || false;
  if (!hasCertifications) {
    suggestions.push('Add certifications to boost your credibility.');
  }
  
  if (!profile.githubUrl || (typeof profile.githubUrl === 'string' && profile.githubUrl.trim() === '')) {
    suggestions.push('Add GitHub or Portfolio links for better recruiter trust.');
  }

  percentage = Math.round(percentage);
  if (percentage > 100) percentage = 100;

  // Strength indicator
  let strength = 'Weak';
  if (percentage >= 71) strength = 'Strong';
  else if (percentage >= 41) strength = 'Average';

  return {
    isComplete: missing.length === 0,
    percentage,
    strength,
    missing,
    suggestions
  };
}
