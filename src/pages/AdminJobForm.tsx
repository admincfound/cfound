import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function AdminJobForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

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

    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await addDoc(collection(db, 'opportunities'), {
        type: 'job',

        title: formData.title,

        companyName: formData.companyName,

        department: formData.department,

        mode: formData.mode,

        state: formData.state,

        city: formData.city,

        location:
          formData.mode === 'Remote'
            ? 'Remote'
            : `${formData.city}, ${formData.state}`,

        timing: formData.timing,

        experience: formData.experience,

        openings: Number(formData.openings || 0),

        featured: formData.featured,

        compType: formData.compType,
        compFormat: formData.compFormat,

        minAmount: formData.minAmount,
        maxAmount: formData.maxAmount,

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

        applications: 0,
        views: 0,

        status: 'active',

        createdAt: serverTimestamp()
      });

      toast.success('Job Created');

      navigate('/careers');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create job');
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
          Create Career Opportunities
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

            <input
              placeholder="Company Name"
              className="input-main"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  companyName: e.target.value
                })
              }
            />

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

          <textarea
            placeholder="Requirements (one per line)"
            className="input-main min-h-[150px]"
            value={formData.requirements}
            onChange={(e) =>
              setFormData({
                ...formData,
                requirements: e.target.value
              })
            }
          />

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
              {loading ? 'Saving...' : 'Create Job'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
