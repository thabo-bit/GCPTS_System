// components/CreateUpcomingProject.tsx
import React, { useState } from 'react';
import {
  Save, X, ArrowLeft,
  HeartHandshake, Landmark, Calendar,
  FileText, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

interface CreateUpcomingProjectProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ngoStageOptions = [
  { num: 1, title: 'Compliance' },
  { num: 2, title: 'Proposal' },
  { num: 3, title: 'Submission' },
  { num: 4, title: 'Evaluation' },
  { num: 5, title: 'Approval' },
];

const STATUS_OPTIONS = [
  'Waiting for Approval',
  'Approved',
  'Rejected',
  'In Progress',
  'Completed',
];

export default function CreateUpcomingProject({ onSuccess, onCancel }: CreateUpcomingProjectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Government Project',
    department: '',
    ward: '',
    location: '',
    duration: '',
    estimatedBudget: '',
    scheduledStart: '',
    tenderStatus: '',
    description: '',
    communityImpact: 'Medium Priority',
    status: 'Waiting for Approval',
    issuer: '',
    govRef: '',
    allocatingMinistry: '',
    ngoPartner: '',
    ngoRole: '',
    currentStage: 1,
    stageDescription: '',
    tags: '',
    imageFile: null as File | null,
    imagePreview: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();

      const payload = {
        title: formData.title,
        category: formData.category,
        department: formData.department,
        ward: formData.ward,
        location: formData.location,
        duration: formData.duration,
        estimatedBudget: Number(formData.estimatedBudget),
        scheduledStart: formData.scheduledStart,
        tenderStatus: formData.tenderStatus,
        description: formData.description,
        communityImpact: formData.communityImpact,
        status: formData.status,
        issuer: formData.issuer,
        govRef: formData.govRef,
        allocatingMinistry: formData.allocatingMinistry,
        ngoPartner: formData.ngoPartner,
        ngoRole: formData.ngoRole,
        currentStage: Number(formData.currentStage),
        stageDescription: formData.stageDescription,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      data.append(
        'project',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );

      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      await axios.post(`${API_URL}/api/upcoming-projects`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToast('Upcoming project created successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 800);
    } catch (err) {
      console.error('Create upcoming project error:', err);
      setToast('Failed to create project. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGov = formData.category === 'Government Project';

  return (
    <>
      <style>{`
        .cup-container { max-width: 960px; margin: 0 auto; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

        .cup-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 20px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .cup-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f1f5f9; border: none; color: #64748b;
          padding: 8px 14px; border-radius: 8px; font-size: 13px;
          font-weight: 500; cursor: pointer; margin-bottom: 12px;
          font-family: inherit;
        }
        .cup-back-btn:hover { background: #e2e8f0; color: #0f172a; }

        .cup-title {
          font-size: 22px; font-weight: 700; color: #0f172a;
          margin: 0 0 6px; letter-spacing: -0.02em;
        }
        .cup-subtitle { font-size: 14px; color: #64748b; margin: 0; }

        .cup-actions { display: flex; gap: 10px; }
        .cup-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: 1px solid transparent; font-family: inherit;
          transition: all 0.2s ease;
        }
        .cup-btn.cancel {
          background: #fff; color: #475569; border-color: #e2e8f0;
        }
        .cup-btn.cancel:hover { background: #f8fafc; }
        .cup-btn.save {
          background: #10b981; color: #fff;
          box-shadow: 0 4px 12px -4px rgba(16,185,129,0.4);
        }
        .cup-btn.save:hover { background: #059669; transform: translateY(-1px); }
        .cup-btn.save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .cup-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 24px; margin-bottom: 18px;
        }
        .cup-card-header {
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        .cup-card-title {
          font-size: 15px; font-weight: 700; color: #0f172a;
          margin: 0 0 4px;
          display: flex; align-items: center; gap: 8px;
        }
        .cup-card-sub { font-size: 12.5px; color: #94a3b8; margin: 0; }

        .cup-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .cup-grid-full { grid-column: 1 / -1; }

        .cup-field { display: flex; flex-direction: column; gap: 6px; }
        .cup-field label {
          font-size: 12px; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .cup-field input,
        .cup-field select,
        .cup-field textarea {
          padding: 11px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        }
        .cup-field input:focus,
        .cup-field select:focus,
        .cup-field textarea:focus {
          border-color: #10b981;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }
        .cup-field textarea { resize: vertical; min-height: 90px; }

        .cup-radio-group {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .cup-radio-card {
          flex: 1; min-width: 160px;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; border-radius: 12px;
          border: 2px solid #e2e8f0; background: #fff;
          cursor: pointer; transition: all 0.2s ease;
          font-size: 13px; font-weight: 500;
        }
        .cup-radio-card:hover { border-color: #cbd5e1; }
        .cup-radio-card.active.gov {
          border-color: #7f9dc4; background: #e5eef8; color: #4f6888;
        }
        .cup-radio-card.active.ngo {
          border-color: #8fb89c; background: #e8f4ee; color: #4a7a5c;
        }

        .cup-image-preview {
          width: 100%; height: 180px;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: #f8fafc;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          color: #94a3b8;
        }
        .cup-image-preview:hover { border-color: #10b981; color: #10b981; }
        .cup-image-preview img { width: 100%; height: 100%; object-fit: cover; }

        .cup-stage-picker {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
        }
        .cup-stage-btn {
          padding: 10px 6px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #fff;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          cursor: pointer; text-align: center;
          font-family: inherit; transition: all 0.2s ease;
        }
        .cup-stage-btn:hover { border-color: #cbd5e1; color: #475569; }
        .cup-stage-btn.active {
          background: #8fb89c; color: #fff; border-color: #8fb89c;
          box-shadow: 0 4px 12px -4px rgba(143,184,156,0.5);
        }

        .cup-toast {
          position: fixed; top: 24px; left: 50%;
          transform: translateX(-50%);
          background: #0f172a; color: #fff;
          padding: 12px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 500;
          z-index: 1000;
          box-shadow: 0 20px 44px -16px rgba(15,23,42,0.5);
          animation: cup-toast-in 0.3s ease;
        }
        @keyframes cup-toast-in {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @media (max-width: 640px) {
          .cup-grid { grid-template-columns: 1fr; }
          .cup-stage-picker { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="cup-container">
        <div className="cup-header">
          <div>
            <button className="cup-back-btn" onClick={onCancel} type="button">
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="cup-title">Add Upcoming Project</h1>
            <p className="cup-subtitle">
              Publish a new initiative to the public pipeline. It appears instantly in the Upcoming Projects view.
            </p>
          </div>
          <div className="cup-actions">
            <button type="button" className="cup-btn cancel" onClick={onCancel}>
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              form="cup-form"
              className="cup-btn save"
              disabled={isSubmitting}
            >
              <Save size={14} /> {isSubmitting ? 'Publishing…' : 'Publish Project'}
            </button>
          </div>
        </div>

        <form id="cup-form" onSubmit={handleSubmit}>

          {/* CARD 1: Overview */}
          <div className="cup-card">
            <div className="cup-card-header">
              <h3 className="cup-card-title"><FileText size={15} /> Project Overview</h3>
              <p className="cup-card-sub">Basic details about the initiative.</p>
            </div>

            <div className="cup-grid">
              <div className="cup-field cup-grid-full">
                <label>Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Galeshewe Stormwater Drainage Overhaul"
                  required
                />
              </div>

              <div className="cup-field cup-grid-full">
                <label>Project Type *</label>
                <div className="cup-radio-group">
                  <div
                    className={`cup-radio-card ${isGov ? 'active gov' : ''}`}
                    onClick={() =>
                      setFormData({ ...formData, category: 'Government Project' })
                    }
                  >
                    <Landmark size={16} /> Government Project
                  </div>
                  <div
                    className={`cup-radio-card ${!isGov ? 'active ngo' : ''}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        category: 'NGO Initiative',
                        department: '', // clear department on switch
                      })
                    }
                  >
                    <HeartHandshake size={16} /> NGO Initiative
                  </div>
                </div>
              </div>

              {/* Department — only shown for Government Projects */}
              {isGov && (
                <div className="cup-field">
                  <label>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Infrastructure & Engineering"
                    required={isGov}
                  />
                </div>
              )}

              <div className={`cup-field ${!isGov ? 'cup-grid-full' : ''}`}>
                <label>Ward *</label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="e.g., Ward 4 - Galeshewe"
                  required
                />
              </div>

              <div className="cup-field cup-grid-full">
                <label>Full Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Matsela Street & 7th Avenue Junction"
                  required
                />
              </div>

              <div className="cup-field cup-grid-full">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Briefly describe what the project will deliver..."
                  required
                />
              </div>

              <div className="cup-field cup-grid-full">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., Infrastructure, Flood Prevention, Municipal"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Timeline & Budget */}
          <div className="cup-card">
            <div className="cup-card-header">
              <h3 className="cup-card-title"><Calendar size={15} /> Timeline & Budget</h3>
              <p className="cup-card-sub">Schedule and financial scope.</p>
            </div>

            <div className="cup-grid">
              <div className="cup-field">
                <label>Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 8 Months"
                  required
                />
              </div>

              <div className="cup-field">
                <label>Scheduled Start *</label>
                <input
                  type="date"
                  name="scheduledStart"
                  value={formData.scheduledStart}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="cup-field">
                <label>Estimated Budget (ZAR) *</label>
                <input
                  type="number"
                  name="estimatedBudget"
                  value={formData.estimatedBudget}
                  onChange={handleInputChange}
                  placeholder="4500000"
                  required
                />
              </div>

              <div className="cup-field">
                <label>Community Impact *</label>
                <select
                  name="communityImpact"
                  value={formData.communityImpact}
                  onChange={handleInputChange}
                >
                  <option value="High Priority">High Priority</option>
                  <option value="Medium Priority">Medium Priority</option>
                  <option value="Low Priority">Low Priority</option>
                </select>
              </div>

              <div className="cup-field">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="cup-field cup-grid-full">
                <label>Status / Stage Note *</label>
                <input
                  type="text"
                  name="tenderStatus"
                  value={formData.tenderStatus}
                  onChange={handleInputChange}
                  placeholder="e.g., Pending Municipal Council Approval"
                  required
                />
              </div>
            </div>
          </div>

          {/* CARD 3: Issuer / Sponsor */}
          <div className="cup-card">
            <div className="cup-card-header">
              <h3 className="cup-card-title">
                {isGov ? <Landmark size={15} /> : <HeartHandshake size={15} />}
                {isGov ? 'Issuing Authority' : 'NGO Partner Details'}
              </h3>
              <p className="cup-card-sub">
                {isGov
                  ? 'Which government department is driving this project.'
                  : 'Which NGO is facilitating this initiative.'}
              </p>
            </div>

            <div className="cup-grid">
              <div className="cup-field cup-grid-full">
                <label>{isGov ? 'Issuing Department / Ministry *' : 'NGO Name *'}</label>
                <input
                  type="text"
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleInputChange}
                  placeholder={
                    isGov ? 'e.g., Northern Cape COGHSTA' : 'e.g., NC Youth Digital Empowerment Trust'
                  }
                  required
                />
              </div>

              {isGov ? (
                <>
                  <div className="cup-field">
                    <label>Government Ref #</label>
                    <input
                      type="text"
                      name="govRef"
                      value={formData.govRef}
                      onChange={handleInputChange}
                      placeholder="e.g., NCG-COGHSTA-2026-089"
                    />
                  </div>
                  <div className="cup-field">
                    <label>Allocating Ministry</label>
                    <input
                      type="text"
                      name="allocatingMinistry"
                      value={formData.allocatingMinistry}
                      onChange={handleInputChange}
                      placeholder="e.g., MEC for Cooperative Governance"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="cup-field">
                    <label>NGO Partner</label>
                    <input
                      type="text"
                      name="ngoPartner"
                      value={formData.ngoPartner}
                      onChange={handleInputChange}
                      placeholder="e.g., NC Youth Digital Trust"
                    />
                  </div>
                  <div className="cup-field cup-grid-full">
                    <label>NGO Role</label>
                    <input
                      type="text"
                      name="ngoRole"
                      value={formData.ngoRole}
                      onChange={handleInputChange}
                      placeholder="e.g., Facilitating workshops and mentorship placement."
                    />
                  </div>
                </>
              )}
            </div>

            {/* NGO Stage Picker */}
            {!isGov && (
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                  Current Approval Stage
                </label>
                <div className="cup-stage-picker">
                  {ngoStageOptions.map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      className={`cup-stage-btn ${formData.currentStage === s.num ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, currentStage: s.num })}
                    >
                      {s.num}. {s.title}
                    </button>
                  ))}
                </div>
                <div className="cup-field" style={{ marginTop: 12 }}>
                  <label>Stage Description</label>
                  <input
                    type="text"
                    name="stageDescription"
                    value={formData.stageDescription}
                    onChange={handleInputChange}
                    placeholder="e.g., Apply formally with business plans and detailed budgets."
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: Cover Image */}
          <div className="cup-card">
            <div className="cup-card-header">
              <h3 className="cup-card-title"><ImageIcon size={15} /> Cover Image</h3>
              <p className="cup-card-sub">Upload a photo representing the project. Optional.</p>
            </div>

            <label className="cup-image-preview">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {formData.imagePreview ? (
                <img src={formData.imagePreview} alt="Preview" />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <ImageIcon size={28} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>Click to upload image</div>
                </div>
              )}
            </label>
          </div>

        </form>
      </div>

      {toast && <div className="cup-toast">{toast}</div>}
    </>
  );
}