import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export default function AdminEditJob() {
  const navigate = useNavigate();
  const { id } = useParams();

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

    mode: 'Remote',
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

    joiningTime: '',

    compType: 'salary',
    compFormat: 'fixed',

    minAmount: '',
    maxAmount: '',

    skills: '',

    jobBenefits: [] as string[],

    description: '',
    responsibilities: '',
    requirements: '',

    featured: false,

    status: 'active',

    state: '',
    city: '',

    contactEmail: 'careers@cfound.in',
    contactPhone: '+91 9361194545',

    salaryCurrency: 'INR'
  });

    const SectionCard = ({
    title,
    children
  }: any) => (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6 space-y-5">
      <h2 className="text-xl font-bold">
        {title}
      </h2>

      {children}
    </div>
  );


    const Label = ({
    children
  }: any) => (
    <label className="block text-sm font-semibold mb-2">
      {children}
    </label>
  );

    useEffect(() => {
    const loadJob = async () => {
      if (!id) return;

      try {
        const snap = await getDoc(
          doc(db, 'opportunities', id)
        );

        if (!snap.exists()) return;

        const data = snap.data();

        setFormData((prev) => ({
          ...prev,

          title: data.title || '',

          isCFoundPosition:
            data.isCFoundPosition ?? true,

          companyName:
            data.companyName ||
            'C Found Technologies',

          mode: data.mode || 'Remote',

          department:
            data.department || '',

          industry:
            data.industry || '',

          educationRequirement:
            data.educationRequirement || '',

          experience:
            data.experience || '',

          openings: String(
            data.openings || ''
          ),

          deadline:
            data.deadline || '',

          type:
            data.jobType || 'full-time',

          contractDuration:
            data.contractDuration || '',

          timing:
            data.timing ||
            'Morning Shift',

          workDays:
            data.workDays || '5 Days',

          hiringUrgently:
            data.hiringUrgently || false,

          joiningTime:
            data.joiningTime || '',

          compType:
            data.compType || 'salary',

          compFormat:
            data.compFormat || 'fixed',

          minAmount:
            data.minAmount || '',

          maxAmount:
            data.maxAmount || '',

          skills: Array.isArray(
            data.skills
          )
            ? data.skills.join(', ')
            : '',

          jobBenefits:
            data.jobBenefits || [],

          description:
            data.description || '',

          responsibilities:
            data.responsibilities || '',

          requirements: Array.isArray(
            data.requirements
          )
            ? data.requirements.join('\n')
            : '',

          featured:
            data.featured || false,

          status:
            data.status || 'active',

          state:
            data.state || '',

          city:
            data.city || '',

          contactEmail:
            data.contactEmail ||
            'careers@cfound.in',

          contactPhone:
            data.contactPhone ||
            '+91 9361194545',

          salaryCurrency:
            data.salaryCurrency || 'INR'
        }));
      } catch (error) {
        console.error(error);
        toast.error(
          'Failed to load job'
        );
      }
    };

    loadJob();
  }, [id]);


    const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!id) return;

    setLoading(true);

    try {
      await updateDoc(
        doc(db, 'opportunities', id),
        {
          type: 'job',

          title: formData.title,

          isCFoundPosition:
            formData.isCFoundPosition,

          companyName:
            formData.companyName,

          mode:
            formData.mode,

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
              formData.openings || 0
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

          joiningTime:
            formData.joiningTime,

          compType:
            formData.compType,

          compFormat:
            formData.compFormat,

          minAmount:
            formData.minAmount,

          maxAmount:
            formData.maxAmount,

          skills: formData.skills
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

          state:
            formData.state,

          city:
            formData.city,

          location:
            formData.mode === 'Remote'
              ? 'Remote'
              : `${formData.city}, ${formData.state}`,

          contactEmail:
            formData.contactEmail,

          contactPhone:
            formData.contactPhone,

          salaryCurrency:
            formData.salaryCurrency
        }
      );

      toast.success(
        'Job Updated Successfully'
      );

      navigate('/careers');
    } catch (error) {
      console.error(error);

      toast.error(
        'Failed to update job'
      );
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-5xl font-black">
            Edit Job
          </h1>

          <p className="text-[var(--text-muted)] mt-2">
            Update and manage
            career opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

                  <SectionCard title="Basic Information">

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label>Job Title</Label>

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
                <Label>Company Name</Label>

                <input
                  className="input-main"
                  disabled={formData.isCFoundPosition}
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyName: e.target.value
                    })
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={formData.isCFoundPosition}
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
                  <Label>Company Email</Label>

                  <input
                    type="email"
                    className="input-main"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactEmail: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Company Contact Number</Label>

                  <input
                    className="input-main"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPhone: e.target.value
                      })
                    }
                  />
                </div>

              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label>Mode</Label>

                <select
                  className="input-main"
                  value={formData.mode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mode: e.target.value
                    })
                  }
                >
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>Onsite</option>
                </select>
              </div>

              <div>
                <Label>Department</Label>

                <input
                  className="input-main"
                  value={formData.department}
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

            {formData.mode !== 'Remote' && (
              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <Label>State</Label>

                  <input
                    className="input-main"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        state: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>City / Town</Label>

                  <input
                    className="input-main"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        city: e.target.value
                      })
                    }
                  />
                </div>

              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label>Industry</Label>

                <input
                  className="input-main"
                  value={formData.industry}
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

            <div className="grid md:grid-cols-3 gap-6">

              <div>
                <Label>Experience</Label>

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

              <div>
                <Label>Openings</Label>

                <input
                  className="input-main"
                  value={formData.openings}
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
                <Label>
                  Application Deadline
                </Label>

                <input
                  type="date"
                  className="input-main"
                  value={formData.deadline}
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

            <div>
              <Label>Job Type</Label>

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

            {formData.type ===
              'contract' && (
              <div>
                <Label>
                  Contract Duration
                </Label>

                <select
                  className="input-main"
                  value={
                    formData.contractDuration
                  }
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

            <div>
              <Label>Shift</Label>

              <select
                className="input-main"
                value={formData.timing}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timing:
                      e.target.value
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
              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <Label>Start Time</Label>

                  <div className="flex gap-3">

                    <input
                      className="input-main"
                      value={formData.workStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workStart: e.target.value
                        })
                      }
                    />

                    <select
                      className="input-main w-28"
                      value={formData.workStartPeriod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workStartPeriod:
                            e.target.value
                        })
                      }
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>

                  </div>
                </div>

                <div>
                  <Label>End Time</Label>

                  <div className="flex gap-3">

                    <input
                      className="input-main"
                      value={formData.workEnd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workEnd: e.target.value
                        })
                      }
                    />

                    <select
                      className="input-main w-28"
                      value={formData.workEndPeriod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workEndPeriod:
                            e.target.value
                        })
                      }
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>

                  </div>
                </div>

              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">

              <div>
                <Label>Work Days</Label>

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
                  <option>5 Days</option>
                  <option>6 Days</option>
                  <option>7 Days</option>
                </select>
              </div>

              <div>
                <Label>Joining Time</Label>

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
                  Hiring Priority
                </Label>

                <label className="flex items-center gap-3 mt-3">
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

                  Hiring Urgently
                </label>
              </div>

            </div>

          </SectionCard>

          <SectionCard title="Compensation">

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <Label>
                  Compensation Type
                </Label>

                <select
                  className="input-main"
                  value={formData.compType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compType:
                        e.target.value
                    })
                  }
                >
                  <option value="salary">
                    Salary
                  </option>

                  <option value="stipend">
                    Stipend
                  </option>

                  <option value="commission">
                    Commission
                  </option>

                  <option value="revenue">
                    Revenue Share
                  </option>
                </select>
              </div>

              <div>
                <Label>
                  Compensation Format
                </Label>

                <select
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
                  <option value="fixed">
                    Fixed
                  </option>

                  <option value="range">
                    Range
                  </option>

                  <option value="negotiable">
                    Negotiable
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>
                </select>
              </div>

            </div>

            {formData.compFormat ===
              'fixed' && (
              <div>
                <Label>Amount</Label>

                <input
                  className="input-main"
                  value={formData.minAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minAmount:
                        e.target.value
                    })
                  }
                />
              </div>
            )}

            {formData.compFormat ===
              'range' && (
              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <Label>
                    Minimum Amount
                  </Label>

                  <input
                    className="input-main"
                    value={formData.minAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minAmount:
                          e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>
                    Maximum Amount
                  </Label>

                  <input
                    className="input-main"
                    value={formData.maxAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAmount:
                          e.target.value
                      })
                    }
                  />
                </div>

              </div>
            )}

            {formData.compFormat ===
              'percentage' && (
              <div>
                <Label>
                  Percentage
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
                      minAmount:
                        e.target.value
                    })
                  }
                />
              </div>
            )}

          </SectionCard>

                    <SectionCard title="Skills & Benefits">

            <div>
              <Label>Skills</Label>

              <textarea
                className="input-main min-h-[120px]"
                placeholder="React, Firebase, TypeScript, UI Design..."
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

              <Label>Benefits</Label>

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
                                (b) =>
                                  b !== benefit
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
              <Label>About Role</Label>

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
              <Label>Responsibilities</Label>

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
              <Label>Requirements</Label>

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

                <label className="flex items-center gap-3 mt-3">

                  <input
                    type="checkbox"
                    checked={
                      formData.featured
                    }
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

                <Label>Status</Label>

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
                : 'Update Job'}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}