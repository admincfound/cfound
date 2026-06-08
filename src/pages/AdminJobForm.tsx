import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const SectionCard = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8 space-y-6">
    <h2 className="text-2xl font-black">
      {title}
    </h2>

    {children}
  </div>
);

const Label = ({
  children,
  required = false
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block text-sm font-semibold mb-2">
    {children}

    {required && (
      <span className="text-red-500 ml-1">
        *
      </span>
    )}
  </label>
);

export default function AdminCreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const benefitOptions = [
    'Work From Home',
    'Flexible Schedule',
    'Performance Bonus',
    'Commission',
    'Certificate',
    'PPO Opportunity',
    'Mentorship',
    'Training Program',
    'Laptop Provided',
    'Internet Allowance',
    'Health Insurance',
    'Paid Leave'
  ];

  const [formData, setFormData] = useState({
    title: '',

    isCFoundPosition: true,

    companyName: 'C Found Technologies',

    contactEmail: 'careers@cfound.in',

    contactPhone: '+91 9361194545',

    mode: 'Remote',

    country: 'India',

    state: '',
    city: '',

    officeLocation: '',

    department: '',

    industry: '',

    educationRequirement: '',

    experience: '',

    openings: '',

    deadline: '',

    type: 'full-time',

    contractDuration: '',

    timing: 'Morning Shift',

    workStart: '09:00',

    workStartPeriod: 'AM',

    workEnd: '06:00',

    workEndPeriod: 'PM',

    workDays: '5 Days',

    hiringUrgently: false,

    freshersAllowed: false,

    joiningTime: '',

    compType: 'Monthly Salary',

    compFormat: 'Fixed',

    minAmount: '',

    maxAmount: '',

    skills: '',

    jobBenefits: [] as string[],

    description: '',

    responsibilities: '',

    requirements: '',

    featured: false,

    status: 'active'
  });

  const validateForm = () => {

    if (!formData.title)
      return 'Job Title is required';

    if (!formData.companyName)
      return 'Company Name is required';

    if (!formData.department)
      return 'Department is required';

    if (
      !formData.freshersAllowed &&
      !formData.experience
    ) {
      return 'Experience is required';
    }

    if (!formData.openings)
      return 'Openings is required';

    if (!formData.deadline)
      return 'Deadline is required';

    if (
      !formData.isCFoundPosition
    ) {
      if (!formData.contactEmail)
        return 'Company Email is required';

      if (!formData.contactPhone)
        return 'Company Contact is required';
    }

    if (!formData.country)
     return 'Country is required';

    if (
      formData.mode === 'Remote'
    ) {
      if (!formData.officeLocation)
        return 'Office Location is required';
    }

    if (
      formData.mode !== 'Remote'
    ) {
      if (!formData.state)
        return 'State is required';

      if (!formData.city)
        return 'City is required';
    }

    if (
      formData.type === 'contract' &&
      !formData.contractDuration
    ) {
      return 'Contract Duration is required';
    }

    if (
      formData.compFormat === 'Fixed' &&
      !formData.minAmount
    ) {
      return 'Amount is required';
    }

    if (
      formData.compFormat === 'Range'
    ) {
      if (!formData.minAmount)
        return 'Minimum Amount is required';

      if (!formData.maxAmount)
        return 'Maximum Amount is required';
    }

    if (!formData.description)
      return 'About Role is required';

    if (!formData.responsibilities)
      return 'Responsibilities are required';

    if (!formData.requirements)
      return 'Requirements are required';

    return null;
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const error =
      validateForm();



    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      await addDoc(
        collection(db, 'careers'),
        {
          slug,
          
          type: 'job',

          title:
            formData.title,

          isCFoundPosition:
            formData.isCFoundPosition,

          companyName:
            formData.companyName,

          contactEmail:
            formData.contactEmail,

          contactPhone:
            formData.contactPhone,

          mode:
            formData.mode,

          country:
            formData.country,

          state:
            formData.state,

          city:
            formData.city,

          officeLocation:
            formData.officeLocation,

          location:
            formData.mode === 'Remote'
              ? formData.officeLocation
              : `${formData.city}, ${formData.state}, ${formData.country}`,

          department:
            formData.department,

          industry:
            formData.industry,

          educationRequirement:
            formData.educationRequirement,

          experience:
            formData.experience,

          openings:
            Number(
              formData.openings
            ),

          deadline:
            formData.deadline,

          jobType:
            formData.type,

          contractDuration:
            formData.contractDuration,

          timing:
            formData.timing,

          workHours:
            formData.timing ===
            'Flexible'
              ? ''
              : `${formData.workStart} ${formData.workStartPeriod} → ${formData.workEnd} ${formData.workEndPeriod}`,

          workDays:
            formData.workDays,

          hiringUrgently:
            formData.hiringUrgently,

          freshersAllowed:
            formData.freshersAllowed,

          joiningTime:
            formData.joiningTime,

          compType:
            formData.compType === 'Monthly Salary'
              ? 'salary'
              : formData.compType === 'Stipend'
              ? 'stipend'
              : formData.compType === 'Commission'
              ? 'commission'
              : 'revenue',

          compFormat:
            formData.compFormat === 'Fixed'
              ? 'fixed'
              : formData.compFormat === 'Range'
              ? 'range'
              : formData.compFormat === 'Percentage'
              ? 'percentage'
              : 'negotiable',

          minAmount:
            formData.minAmount,

          maxAmount:
            formData.maxAmount,

          skills:
            formData.skills
              .split(',')
              .map((x) =>
                x.trim()
              )
              .filter(Boolean),

          jobBenefits:
            formData.jobBenefits,

          description:
            formData.description,

          responsibilities:
            formData.responsibilities,

          requirements:
            formData.requirements
              .split('\n')
              .filter((x) =>
                x.trim()
              ),

          featured:
            formData.featured,

          status:
            formData.status,

          applications: 0,
          views: 0,
          createdAt: serverTimestamp()
        }
      );

      toast.success('Job Created Successfully');

      navigate('/careers');

    } catch (error) {

      console.error(error);

      toast.error('Failed to create job');

    } finally {

      setLoading(false);

    }
  };

  return (
  <div className="pt-32 pb-24 px-6 min-h-screen bg-[var(--bg-main)]">
    <div className="max-w-6xl mx-auto">

      <div className="mb-10">
        <h1 className="text-5xl font-black">
          Create Job
        </h1>

        <p className="text-[var(--text-muted)] mt-2">
          Create and publish career opportunities.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        <SectionCard title="Basic Information">

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <Label required>
                Job Title
              </Label>

              <input
                className="input-main"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label required>
                Company Name
              </Label>

              <input
                className="input-main"
                disabled={
                  formData.isCFoundPosition
                }
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyName:
                      e.target.value
                  })
                }
              />
            </div>

          </div>

          <label className="flex items-center gap-3 font-medium">

            <input
              type="checkbox"
              checked={
                formData.isCFoundPosition
              }
              onChange={(e) =>
                setFormData({
                  ...formData,

                  isCFoundPosition:
                    e.target.checked,

                  companyName:
                    e.target.checked
                      ? 'C Found Technologies'
                      : '',

                  contactEmail:
                    e.target.checked
                      ? 'careers@cfound.in'
                      : '',

                  contactPhone:
                    e.target.checked
                      ? '+91 9361194545'
                      : ''
                })
              }
            />

            C Found Position

          </label>

          {!formData.isCFoundPosition && (

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label required>
                  Company Email
                </Label>

                <input
                  type="email"
                  className="input-main"
                  value={
                    formData.contactEmail
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactEmail:
                        e.target.value
                    })
                  }
                />
              </div>

              <div>
                <Label required>
                  Company Contact
                </Label>

                <input
                  className="input-main"
                  value={
                    formData.contactPhone
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactPhone:
                        e.target.value
                    })
                  }
                />
              </div>

            </div>

          )}

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <Label required>
                Mode
              </Label>

              <select
                className="input-main"
                value={formData.mode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode:
                      e.target.value
                  })
                }
              >
                <option>
                  Remote
                </option>

                <option>
                  Hybrid
                </option>

                <option>
                  Onsite
                </option>
              </select>
            </div>

            <div>
              <Label required>
                Country
              </Label>

              <input
                className="input-main"
                value={formData.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    country: e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label required>
                Department
              </Label>

              <input
                className="input-main"
                value={
                  formData.department
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    department:
                      e.target.value
                  })
                }
              />
            </div>

          </div>

          {formData.mode === 'Remote' && (

            <div>

              <Label required>
                Office Location
              </Label>

              <input
                className="input-main"
                placeholder="Chennai, Tamil Nadu"
                value={formData.officeLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    officeLocation: e.target.value
                  })
                }
              />

            </div>

          )}

          {formData.mode !== 'Remote' && (

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label required>
                  State
                </Label>

                <input
                  className="input-main"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state:
                        e.target.value
                    })
                  }
                />
              </div>

              <div>
                <Label required>
                  City / Town
                </Label>

                <input
                  className="input-main"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city:
                        e.target.value
                    })
                  }
                />
              </div>

            </div>

          )}

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <Label>
                Industry
              </Label>

              <input
                className="input-main"
                value={
                  formData.industry
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industry:
                      e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label>
                Education Requirement
              </Label>

              <input
                className="input-main"
                value={
                  formData.educationRequirement
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    educationRequirement:
                      e.target.value
                  })
                }
              />
            </div>

          </div>

        </SectionCard>

        <SectionCard title="Hiring Details">

          <div className="grid md:grid-cols-4 gap-6">

            <div>
              <Label>
                Freshers Allowed
              </Label>

              <label className="flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  checked={formData.freshersAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      freshersAllowed: e.target.checked,
                      experience: e.target.checked
                        ? 'Fresher'
                        : ''
                    })
                  }
                />

                Yes
              </label>
            </div>

            {!formData.freshersAllowed && (
              <div>
                <Label required>
                  Experience
                </Label>

                <input
                  className="input-main"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience:
                        e.target.value
                    })
                  }
                />
              </div>
            )}

            <div>
              <Label required>
                Openings
              </Label>

              <input
                className="input-main"
                value={
                  formData.openings
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    openings:
                      e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label required>
                Deadline
              </Label>

              <input
                type="date"
                className="input-main"
                value={
                  formData.deadline
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadline:
                      e.target.value
                  })
                }
              />
            </div>

          </div>

                    <div className="mt-6">
            <Label required>
              Job Type
            </Label>

            <select
              className="input-main"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value
                })
              }
            >
              <option value="full-time">
                Full Time
              </option>

              <option value="part-time">
                Part Time
              </option>

              <option value="contract">
                Contract
              </option>

              <option value="freelance">
                Freelance
              </option>
            </select>
          </div>

          {formData.type === 'contract' && (

            <div className="mt-6">

              <Label required>
                Contract Duration
              </Label>

              <select
                className="input-main"
                value={formData.contractDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contractDuration:
                      e.target.value
                  })
                }
              >
                <option value="">
                  Select Duration
                </option>

                <option>
                  1 Month
                </option>

                <option>
                  3 Months
                </option>

                <option>
                  6 Months
                </option>

                <option>
                  1 Year
                </option>
              </select>

            </div>

          )}

          <div className="mt-6">

            <Label required>
              Shift
            </Label>

            <select
              className="input-main"
              value={formData.timing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  timing: e.target.value
                })
              }
            >
              <option>
                Morning Shift
              </option>

              <option>
                Evening Shift
              </option>

              <option>
                Night Shift
              </option>

              <option>
                Flexible
              </option>
            </select>

          </div>

          {formData.timing !== 'Flexible' && (

            <div className="grid md:grid-cols-2 gap-6 mt-6">

              <div>

                <Label required>
                  Start Time
                </Label>

                <div className="flex gap-3">

                  <input
                    className="input-main"
                    value={formData.workStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workStart:
                          e.target.value
                      })
                    }
                  />

                  <select
                    className="input-main w-28"
                    value={
                      formData.workStartPeriod
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workStartPeriod:
                          e.target.value
                      })
                    }
                  >
                    <option>
                      AM
                    </option>

                    <option>
                      PM
                    </option>
                  </select>

                </div>

              </div>

              <div>

                <Label required>
                  End Time
                </Label>

                <div className="flex gap-3">

                  <input
                    className="input-main"
                    value={formData.workEnd}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workEnd:
                          e.target.value
                      })
                    }
                  />

                  <select
                    className="input-main w-28"
                    value={
                      formData.workEndPeriod
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workEndPeriod:
                          e.target.value
                      })
                    }
                  >
                    <option>
                      AM
                    </option>

                    <option>
                      PM
                    </option>
                  </select>

                </div>

              </div>

            </div>

          )}

          <div className="grid md:grid-cols-3 gap-6 mt-6">

            <div>

              <Label>
                Work Days
              </Label>

              <select
                className="input-main"
                value={formData.workDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workDays:
                      e.target.value
                  })
                }
              >
                <option>
                  5 Days
                </option>

                <option>
                  6 Days
                </option>

                <option>
                  7 Days
                </option>
              </select>

            </div>

            <div>

              <Label>
                Joining Time
              </Label>

              <select
                className="input-main"
                value={formData.joiningTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    joiningTime:
                      e.target.value
                  })
                }
              >
                <option value="">
                  Select
                </option>

                <option>
                  Immediate
                </option>

                <option>
                  Within 7 Days
                </option>

                <option>
                  Within 15 Days
                </option>

                <option>
                  Within 30 Days
                </option>
              </select>

            </div>

            <div>

              <Label>
                Hiring Urgently
              </Label>

              <label className="flex items-center gap-3 mt-4">

                <input
                  type="checkbox"
                  checked={
                    formData.hiringUrgently
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hiringUrgently:
                        e.target.checked
                    })
                  }
                />

                Yes
              </label>

            </div>

          </div>

        </SectionCard>

        <SectionCard title="Compensation">

          <div className="grid md:grid-cols-2 gap-6">

            <div>

              <Label required>
                Compensation Type
              </Label>

              <select
                className="input-main"
                value={formData.compType}
                onChange={(e) => {

                  const value =
                    e.target.value;

                  setFormData({
                    ...formData,

                    compType: value,

                    compFormat:
                      value ===
                      'Revenue Share'
                        ? 'Percentage'
                        : 'Fixed'
                  });
                }}
              >
                <option>
                  Monthly Salary
                </option>

                <option>
                  Stipend
                </option>

                <option>
                  Commission
                </option>

                <option>
                  Revenue Share
                </option>
              </select>

            </div>

            <div>

              <Label required>
                Compensation Format
              </Label>

              <select
                disabled={
                  formData.compType ===
                  'Revenue Share'
                }
                className="input-main"
                value={formData.compFormat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    compFormat:
                      e.target.value
                  })
                }
              >
                {[
                  'Monthly Salary',
                  'Stipend'
                ].includes(
                  formData.compType
                ) && (
                  <>
                    <option>
                      Fixed
                    </option>

                    <option>
                      Range
                    </option>

                    <option>
                      Negotiable
                    </option>
                  </>
                )}

                {formData.compType ===
                  'Commission' && (
                  <>
                    <option>
                      Fixed
                    </option>

                    <option>
                      Percentage
                    </option>
                  </>
                )}

                {formData.compType ===
                  'Revenue Share' && (
                  <option>
                    Percentage
                  </option>
                )}
              </select>

            </div>

          </div>

                    {formData.compFormat === 'Fixed' && (

            <div className="mt-6">

              <Label required>
                Amount (₹)
              </Label>

              <input
                className="input-main"
                value={formData.minAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minAmount: e.target.value
                  })
                }
              />

            </div>

          )}

          {formData.compFormat === 'Range' && (

            <div className="grid md:grid-cols-2 gap-6 mt-6">

              <div>

                <Label required>
                  Minimum Amount (₹)
                </Label>

                <input
                  className="input-main"
                  value={formData.minAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minAmount: e.target.value
                    })
                  }
                />

              </div>

              <div>

                <Label required>
                  Maximum Amount (₹)
                </Label>

                <input
                  className="input-main"
                  value={formData.maxAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAmount: e.target.value
                    })
                  }
                />

              </div>

            </div>

          )}

          {formData.compFormat === 'Percentage' && (

            <div className="mt-6">

              <Label required>
                Percentage (%)
              </Label>

              <input
                type="number"
                min="1"
                max="100"
                className="input-main"
                value={formData.minAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minAmount: e.target.value
                  })
                }
              />

            </div>

          )}

        </SectionCard>

        <SectionCard title="Skills & Benefits">

          <div>

            <Label>
              Skills
            </Label>

            <textarea
              className="input-main min-h-[120px]"
              placeholder="React, Firebase, HR, Sales..."
              value={formData.skills}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skills: e.target.value
                })
              }
            />

          </div>

          <div>

            <Label>
              Benefits
            </Label>

            <div className="flex flex-wrap gap-3">

              {benefitOptions.map((benefit) => {

                const selected =
                  formData.jobBenefits.includes(
                    benefit
                  );

                return (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        jobBenefits: selected
                          ? formData.jobBenefits.filter(
                              (b) => b !== benefit
                            )
                          : [
                              ...formData.jobBenefits,
                              benefit
                            ]
                      })
                    }
                    className={`px-4 py-2 rounded-full border transition ${
                      selected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'hover:border-primary-500'
                    }`}
                  >
                    {benefit}
                  </button>
                );
              })}

            </div>

          </div>

        </SectionCard>

        <SectionCard title="Job Description">

          <div>

            <Label required>
              About Role
            </Label>

            <textarea
              className="input-main min-h-[180px]"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description:
                    e.target.value
                })
              }
            />

          </div>

          <div>

            <Label required>
              Responsibilities
            </Label>

            <textarea
              className="input-main min-h-[180px]"
              value={formData.responsibilities}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  responsibilities:
                    e.target.value
                })
              }
            />

          </div>

          <div>

            <Label required>
              Requirements
            </Label>

            <textarea
              className="input-main min-h-[180px]"
              placeholder="One requirement per line"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requirements:
                    e.target.value
                })
              }
            />

          </div>

        </SectionCard>

        <SectionCard title="Publishing">

          <div className="grid md:grid-cols-2 gap-6">

            <div>

              <Label>
                Featured Job
              </Label>

              <label className="flex items-center gap-3 mt-4">

                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      featured:
                        e.target.checked
                    })
                  }
                />

                Show as Featured
              </label>

            </div>

            <div>

              <Label required>
                Status
              </Label>

              <select
                className="input-main"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status:
                      e.target.value
                  })
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>

            </div>

          </div>

        </SectionCard>

        <div className="flex justify-end gap-4 pb-10">

          <button
            type="button"
            onClick={() =>
              navigate('/careers')
            }
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? 'Saving...'
              : 'Create Job'}
          </button>

        </div>

      </form>

    </div>
  </div>
);
}