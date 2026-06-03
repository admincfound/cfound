import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function AdminEditJob() {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const loadJob = async () => {
      if (!id) return;

      const snap = await getDoc(doc(db, 'opportunities', id));

      if (!snap.exists()) return;

      const data = snap.data();

      setFormData({
        title: data.title || '',
        companyName: data.companyName || '',
        department: data.department || '',
        mode: data.mode || 'Remote',

        state: data.state || '',
        city: data.city || '',

        timing: data.timing || 'Morning Shift',

        type: data.jobType || 'full-time',

        experience: data.experience || '',

        openings: String(data.openings || ''),

        featured: data.featured || false,

        compType: data.compType || 'salary',
        compFormat: data.compFormat || 'fixed',

        minAmount: data.minAmount || '',
        maxAmount: data.maxAmount || '',

        skills: Array.isArray(data.skills)
          ? data.skills.join(', ')
          : '',

        description: data.description || '',

        responsibilities: data.responsibilities || '',

        requirements: Array.isArray(data.requirements)
          ? data.requirements.join('\n')
          : '',

        deadline: data.deadline || '',

        status: data.status || 'active',

        isCFoundPosition: data.isCFoundPosition ?? true,
        contactEmail: data.contactEmail || 'careers@cfound.in',
        contactPhone: data.contactPhone || '+91 9361194545',

        educationRequirement: data.educationRequirement || '',
        industry: data.industry || '',
        workHours: data.workHours || '',
        jobBenefits: Array.isArray(data.jobBenefits)
          ? data.jobBenefits
          : [],
        salaryCurrency: data.salaryCurrency || 'INR'
      });
    };

    loadJob();
  }, [id]);

  const [loading, setLoading] = useState(false);

  const benefitOptions = [
    'Work From Home',
    'Flexible Schedule',
    'Performance Bonus',
    'Commission Pay',
    'Paid Internship',
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
    companyName: '',
    department: '',
    mode: 'Remote',

    state: '',
    city: '',

    timing: 'Morning Shift',

    type: 'full-time',

    experience: '',

    openings: '',

    featured: false,

    compType: 'salary',
    compFormat: 'fixed',

    minAmount: '',
    maxAmount: '',

    skills: '',

    description: '',
    responsibilities: '',
    requirements: '',

    deadline: '',

    status: 'active',

    isCFoundPosition: true,
    contactEmail: 'careers@cfound.in',
    contactPhone: '+91 9361194545',

    educationRequirement: '',
    industry: '',
    workStart: '09:00',
    workStartPeriod: 'AM',

    workEnd: '06:00',
    workEndPeriod: 'PM',
    jobBenefits: [],
    salaryCurrency: 'INR'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {

      if (
        formData.compFormat === 'percentage' &&
        (Number(formData.minAmount) < 1 ||
         Number(formData.minAmount) > 100)
      ) {
        toast.error('Percentage must be between 1 and 100');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'opportunities', id), {
        type: 'job',

        title: formData.title,

        companyName: formData.companyName,
        isCFoundPosition: formData.isCFoundPosition,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,

        department: formData.department,

        mode: formData.mode,

        state: formData.state,

        city: formData.city,

        location:
          formData.mode === 'Remote'
            ? 'Remote'
            : `${formData.city}, ${formData.state}`,

        timing: formData.timing,

        jobType: formData.type,
        
        experience: formData.experience,

        openings: Number(formData.openings || 0),

        featured: formData.featured,

        compType: formData.compType,
        compFormat: formData.compFormat,

        minAmount:
          formData.compFormat === 'negotiable'
            ? ''
            : formData.minAmount,

        maxAmount:
          formData.compFormat === 'range'
            ? formData.maxAmount
            : '',

        description: formData.description,

        responsibilities: formData.responsibilities,

        requirements: formData.requirements
          .split('\n')
          .filter((x) => x.trim()),

        skills: formData.skills
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),

        deadline: formData.deadline,

        status: formData.status,

        educationRequirement: formData.educationRequirement,
        industry: formData.industry,
        workHours: `${formData.workStart} ${formData.workStartPeriod} → ${formData.workEnd} ${formData.workEndPeriod}`,
        jobBenefits: formData.jobBenefits,
        salaryCurrency: formData.salaryCurrency,
      });

      toast.success('Job Updated');

      navigate('/careers');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update job');
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

          <div className="grid md:grid-cols-2 gap-6">

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

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isCFoundPosition}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setFormData({
                    ...formData,
                    isCFoundPosition: checked,
                    companyName: checked ? 'C Found Technologies' : '',
                    contactEmail: checked ? 'careers@cfound.in' : '',
                    contactPhone: checked ? '+91 9361194545' : ''
                  });
                }}
              />
              C Found Position
            </label>

            <input
              placeholder="Company Name"
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

            {!formData.isCFoundPosition && (
              <div className="grid md:grid-cols-2 gap-6">

                <input
                  placeholder="Contact Email"
                  className="input-main"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactEmail: e.target.value
                    })
                  }
                />

                <input
                  placeholder="Contact Phone"
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
            )}
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

            <select
              className="input-main"
              value={formData.department}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  department: e.target.value
                })
              }
            >
              <option value="">Department</option>
              <option value="Software Development">
                Software Development
              </option>
              <option value="Game Development">
                Game Development
              </option>
              <option value="AI/ML">
                AI/ML
              </option>
              <option value="UI/UX">
                UI/UX
              </option>
              <option value="Sales">
                Sales
              </option>
            </select>

          </div>

          {formData.mode !== 'Remote' && (
            <div className="grid md:grid-cols-2 gap-6">

              <select
                className="input-main"
                value={formData.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    state: e.target.value
                  })
                }
              >
                <option value="">Select State</option>
                <option>Tamil Nadu</option>
                <option>Kerala</option>
                <option>Karnataka</option>
                <option>Maharashtra</option>
                <option>Telangana</option>
                <option>Andhra Pradesh</option>
              </select>

              <input
                placeholder="City / Town / Village"
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
          )}

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

          <div className="grid md:grid-cols-2 gap-6">

            <select
              className="input-main"
              value={formData.educationRequirement}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  educationRequirement: e.target.value
                })
              }
            >
              <option value="">Education Requirement</option>
              <option value="10th Pass">10th Pass</option>
              <option value="12th Pass">12th Pass</option>
              <option value="Diploma">Diploma</option>
              <option value="Any Degree">Any Degree</option>
              <option value="BCA">BCA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="B.Tech / BE">B.Tech / BE</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
              <option value="Any Qualification">Any Qualification</option>
            </select>

            <select
              className="input-main"
              value={formData.industry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  industry: e.target.value
                })
              }
            >
              <option value="">Industry</option>
              <option value="Software Development">Software Development</option>
              <option value="Game Development">Game Development</option>
              <option value="AI / ML">AI / ML</option>
              <option value="Education">Education</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Customer Support">Customer Support</option>
            </select>

            <div className="grid grid-cols-2 gap-4">

            <label className="block mb-2 font-semibold md:col-span-2">
              Working Hours
            </label>

            <div className="flex gap-2">

              <select
                className="input-main"
                value={formData.workStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workStart: e.target.value
                  })
                }
              >
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="01:00">01:00</option>
                <option value="02:00">02:00</option>
                <option value="03:00">03:00</option>
                <option value="04:00">04:00</option>
                <option value="05:00">05:00</option>
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
              </select>

              <select
                className="input-main"
                value={formData.workStartPeriod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workStartPeriod: e.target.value
                  })
                }
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>

            </div>

            <div className="flex gap-2">

              <select
                className="input-main"
                value={formData.workEnd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workEnd: e.target.value
                  })
                }
              >
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
              </select>

              <select
                className="input-main"
                value={formData.workEndPeriod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workEndPeriod: e.target.value
                  })
                }
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>

            </div>

          </div>

          </div>

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

          <div>
            <label className="block mb-3 font-semibold">
              Benefits
            </label>

            <div className="flex flex-wrap gap-2">

              {benefitOptions.map((benefit) => {

                const selected =
                  formData.jobBenefits.includes(benefit);

                return (
                  <button
                    type="button"
                    key={benefit}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        jobBenefits: selected
                          ? formData.jobBenefits.filter(
                              (b) => b !== benefit
                            )
                          : [...formData.jobBenefits, benefit]
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

          <textarea
            placeholder="Responsibilities"
            className="input-main min-h-[150px]"
            value={formData.responsibilities}
            onChange={(e) =>
              setFormData({
                ...formData,
                responsibilities: e.target.value
              })
            }
          />
          <div className="grid md:grid-cols-3 gap-6">

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
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>

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
            <option value="Morning Shift">Morning Shift</option>
            <option value="Evening Shift">Evening Shift</option>
            <option value="Night Shift">Night Shift</option>
            <option value="Flexible">Flexible</option>
          </select>

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
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>

        </div>

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
            placeholder="Percentage (1-100)"
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

          <div className="flex justify-end gap-4">

            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Update Job'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
