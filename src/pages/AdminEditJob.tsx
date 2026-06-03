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
    'Commission Pay',
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
    companyName: 'C Found Technologies',

    isCFoundPosition: true,

    mode: 'Remote',
    department: '',

    experience: '',
    openings: '',
    deadline: '',

    educationRequirement: '',
    industry: '',

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

    useEffect(() => {
    const loadJob = async () => {
      if (!id) return;

      try {
        const snap = await getDoc(
          doc(db, 'opportunities', id)
        );

        if (!snap.exists()) return;

        const data = snap.data();

        setFormData({
          title: data.title || '',
          companyName:
            data.companyName || 'C Found Technologies',

          isCFoundPosition:
            data.isCFoundPosition ?? true,

          mode: data.mode || 'Remote',
          department: data.department || '',

          experience: data.experience || '',
          openings: String(data.openings || ''),

          deadline: data.deadline || '',

          educationRequirement:
            data.educationRequirement || '',

          industry: data.industry || '',

          type: data.jobType || 'full-time',

          contractDuration:
            data.contractDuration || '',

          timing:
            data.timing || 'Morning Shift',

          workStart: '09:00',
          workStartPeriod: 'AM',

          workEnd: '06:00',
          workEndPeriod: 'PM',

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

          skills: Array.isArray(data.skills)
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
        });
      } catch (error) {
        console.error(error);
      }
    };

    loadJob();
  }, [id]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      await updateDoc(
        doc(db, 'opportunities', id!),
        {
          type: 'job',

          title: formData.title,

          companyName:
            formData.companyName,

          isCFoundPosition:
            formData.isCFoundPosition,

          department:
            formData.department,

          mode:
            formData.mode,

          state:
            formData.state,

          city:
            formData.city,

          location:
            formData.mode === 'Remote'
              ? 'Remote'
              : `${formData.city}, ${formData.state}`,

          experience:
            formData.experience,

          openings:
            Number(formData.openings || 0),

          deadline:
            formData.deadline,

          educationRequirement:
            formData.educationRequirement,

          industry:
            formData.industry,

          jobType:
            formData.type,

          contractDuration:
            formData.contractDuration,

          timing:
            formData.timing,

          workHours:
            formData.timing === 'Flexible'
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
            .map((x) => x.trim())
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
              .filter((x) => x.trim()),

          featured:
            formData.featured,

          status:
            formData.status,

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
        'Failed To Update Job'
      );
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl md:text-7xl font-black mb-3">
          Job Management
        </h1>

        <p className="text-[var(--text-muted)] mb-10">
          Edit Career Opportunity
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8 space-y-8"
        >

          {/* Job Title */}

          <input
            placeholder="Job Title"
            className="input-main"
            value={formData.title}
            onChange={(e) =>
              setFormData({
                ...formData,
                title: e.target.value
              })
            }
          />

          {/* C Found */}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isCFoundPosition}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isCFoundPosition: e.target.checked
                })
              }
            />
            C Found Position
          </label>

          {/* Company */}

          <input
            placeholder="Company Name"
            className="input-main"
            value={formData.companyName}
            disabled={formData.isCFoundPosition}
            onChange={(e) =>
              setFormData({
                ...formData,
                companyName: e.target.value
              })
            }
          />

          {/* Mode + Department */}

          <div className="grid md:grid-cols-2 gap-6">

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
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <input
              placeholder="Department"
              className="input-main"
              value={formData.department}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  department: e.target.value
                })
              }
            />

          </div>

          {/* Experience */}

          <div className="grid md:grid-cols-3 gap-6">

            <input
              placeholder="Experience"
              className="input-main"
              value={formData.experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience: e.target.value
                })
              }
            />

            <input
              placeholder="Openings"
              className="input-main"
              value={formData.openings}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  openings: e.target.value
                })
              }
            />

            <input
              type="date"
              className="input-main"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deadline: e.target.value
                })
              }
            />

          </div>

          {/* Education + Industry */}

          <div className="grid md:grid-cols-2 gap-6">

            <input
              placeholder="Education Requirement"
              className="input-main"
              value={formData.educationRequirement}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  educationRequirement:
                    e.target.value
                })
              }
            />

            <input
              placeholder="Industry"
              className="input-main"
              value={formData.industry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  industry: e.target.value
                })
              }
            />

          </div>

          {/* Job Type */}

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

          {/* Contract Duration */}

          {formData.type === 'contract' && (
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
                Contract Duration
              </option>

              <option value="1 Month">
                1 Month
              </option>

              <option value="3 Months">
                3 Months
              </option>

              <option value="6 Months">
                6 Months
              </option>

              <option value="1 Year">
                1 Year
              </option>
            </select>
          )}

          {/* Shift */}

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
            <option value="Morning Shift">
              Morning Shift
            </option>

            <option value="Evening Shift">
              Evening Shift
            </option>

            <option value="Night Shift">
              Night Shift
            </option>

            <option value="Flexible">
              Flexible
            </option>
          </select>

          {/* Working Hours */}

          {formData.timing !== 'Flexible' && (
            <div className="grid md:grid-cols-2 gap-6">

              <input
                placeholder="Start Time"
                className="input-main"
                value={formData.workStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workStart: e.target.value
                  })
                }
              />

              <input
                placeholder="End Time"
                className="input-main"
                value={formData.workEnd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workEnd: e.target.value
                  })
                }
              />

            </div>
          )}

          {/* Work Days */}

          <select
            className="input-main"
            value={formData.workDays}
            onChange={(e) =>
              setFormData({
                ...formData,
                workDays: e.target.value
              })
            }
          >
            <option value="5 Days">
              5 Days
            </option>

            <option value="6 Days">
              6 Days
            </option>

            <option value="7 Days">
              7 Days
            </option>
          </select>

          {/* Hiring Urgently */}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.hiringUrgently}
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

          {/* Joining Time */}

          <input
            placeholder="Joining Time"
            className="input-main"
            value={formData.joiningTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                joiningTime:
                  e.target.value
              })
            }
          />


                    {/* Compensation */}

          <div className="grid md:grid-cols-2 gap-6">

            <select
              className="input-main"
              value={formData.compType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  compType: e.target.value
                })
              }
            >
              <option value="salary">Salary</option>
              <option value="stipend">Stipend</option>
              <option value="commission">Commission</option>
              <option value="revenue">Revenue Share</option>
            </select>

            <select
              className="input-main"
              value={formData.compFormat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  compFormat: e.target.value
                })
              }
            >
              <option value="fixed">Fixed</option>
              <option value="range">Range</option>
              <option value="negotiable">Negotiable</option>
              <option value="percentage">Percentage</option>
            </select>

          </div>

          {formData.compFormat === 'fixed' && (
            <input
              placeholder="Amount"
              className="input-main"
              value={formData.minAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minAmount: e.target.value
                })
              }
            />
          )}

          {formData.compFormat === 'range' && (
            <div className="grid md:grid-cols-2 gap-6">

              <input
                placeholder="Minimum Amount"
                className="input-main"
                value={formData.minAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minAmount: e.target.value
                  })
                }
              />

              <input
                placeholder="Maximum Amount"
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
          )}

          {formData.compFormat === 'percentage' && (
            <input
              type="number"
              min="1"
              max="100"
              placeholder="Percentage"
              className="input-main"
              value={formData.minAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minAmount: e.target.value
                })
              }
            />
          )}

          {/* Skills */}

          <textarea
            placeholder="Skills (comma separated)"
            className="input-main min-h-[100px]"
            value={formData.skills}
            onChange={(e) =>
              setFormData({
                ...formData,
                skills: e.target.value
              })
            }
          />

          {/* Benefits */}

          <div>

            <label className="block mb-3 font-semibold">
              Benefits
            </label>

            <div className="flex flex-wrap gap-2">

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
                    className={`px-4 py-2 rounded-full border ${
                      selected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : ''
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {benefit}
                  </button>
                );
              })}

            </div>

          </div>

          {/* About Role */}

          <textarea
            placeholder="About Role"
            className="input-main min-h-[150px]"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value
              })
            }
          />

          {/* Responsibilities */}

          <textarea
            placeholder="Responsibilities"
            className="input-main min-h-[150px]"
            value={formData.responsibilities}
            onChange={(e) =>
              setFormData({
                ...formData,
                responsibilities:
                  e.target.value
              })
            }
          />

          {/* Requirements */}

          <textarea
            placeholder="Requirements (one per line)"
            className="input-main min-h-[150px]"
            value={formData.requirements}
            onChange={(e) =>
              setFormData({
                ...formData,
                requirements:
                  e.target.value
              })
            }
          />

          {/* Featured */}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  featured: e.target.checked
                })
              }
            />
            Featured Job
          </label>

          {/* Status */}

          <select
            className="input-main"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value
              })
            }
          >
            <option value="active">
              Active
            </option>

            <option value="closed">
              Closed
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

          {/* Buttons */}

          <div className="flex justify-end gap-4">

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