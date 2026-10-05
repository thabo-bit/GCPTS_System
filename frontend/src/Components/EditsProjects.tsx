// components/EditsProjects.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Trash2,
  Upload,
  FileText
} from 'lucide-react';
import axios from 'axios';
import './EditProject.css';
import type { Project } from './ProjectsList';

const API_URL = 'http://localhost:8080';

interface EditProjectProps {
  projectData?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  category: string;
  department: string;
  location: string;
  description: string;
  goals: string;
  objectives: string;
  projectManager: string;
  contractor: string;
  gpsCoordinates: string;
  startDate: string;
  expectedCompletion: string;
  overallProgress: number;
  status: string;
  budgetAllocated: string;
  budgetUsed: string;
  fundingSources: { id: number; name: string; amount: string }[];
  milestones: { id: number; name: string; date: string; status: string }[];
  blueprints: File[];
  additionalDocuments: File[];
}

export default function EditProject({ projectData, onSuccess, onCancel }: EditProjectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(projectData || null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    department: '',
    location: '',
    description: '',
    goals: '',
    objectives: '',
    projectManager: '',
    contractor: '',
    gpsCoordinates: '',
    startDate: '',
    expectedCompletion: '',
    overallProgress: 0,
    status: 'On Track',
    budgetAllocated: '',
    budgetUsed: '',
    fundingSources: [{ id: 1, name: '', amount: '' }],
    milestones: [{ id: 1, name: '', date: '', status: 'Pending' }],
    blueprints: [],
    additionalDocuments: []
  });

  useEffect(() => {
    if (projectData) {
      populateForm(projectData);
    }
  }, [projectData]);

  const populateForm = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title || '',
      category: project.category || '',
      department: project.department || '',
      location: project.location || '',
      description: project.description || '',
      goals: project.goals || '',
      objectives: project.objectives || '',
      projectManager: project.projectManager || '',
      contractor: project.contractor || '',
      gpsCoordinates: project.gpsCoordinates || '',
      startDate: project.startDate || '',
      expectedCompletion: project.expectedCompletion || '',
      overallProgress: project.overallProgress || 0,
      status: project.status || 'On Track',
      budgetAllocated: project.budgetAllocated?.toString() || '',
      budgetUsed: project.budgetUsed?.toString() || '',
      fundingSources: project.fundingSources?.length > 0
        ? project.fundingSources.map((f) => ({ ...f, amount: f.amount.toString() }))
        : [{ id: 1, name: '', amount: '' }],
      milestones: project.milestones?.length > 0
        ? project.milestones
        : [{ id: 1, name: '', date: '', status: 'Pending' }],
      blueprints: [],
      additionalDocuments: []
    });
  };

  const handleBack = () => {
    if (onCancel) onCancel();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'blueprints' | 'additionalDocuments'
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newFiles]
      }));
    }
  };

  const removeFile = (index: number, type: 'blueprints' | 'additionalDocuments') => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addFundingSource = () => {
    setFormData({
      ...formData,
      fundingSources: [...formData.fundingSources, { id: Date.now(), name: '', amount: '' }]
    });
  };

  const updateFundingSource = (id: number, field: string, value: string) => {
    setFormData({
      ...formData,
      fundingSources: formData.fundingSources.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      )
    });
  };

  const removeFundingSource = (id: number) => {
    setFormData({
      ...formData,
      fundingSources: formData.fundingSources.filter((f) => f.id !== id)
    });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { id: Date.now(), name: '', date: '', status: 'Pending' }]
    });
  };

  const updateMilestone = (id: number, field: string, value: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    });
  };

  const removeMilestone = (id: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((m) => m.id !== id)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();

      const projectPayload = {
        title: formData.title,
        category: formData.category,
        department: formData.department,
        description: formData.description,
        goals: formData.goals,
        objectives: formData.objectives,
        location: formData.location,
        gpsCoordinates: formData.gpsCoordinates,
        projectManager: formData.projectManager,
        contractor: formData.contractor,
        startDate: formData.startDate,
        expectedCompletion: formData.expectedCompletion,
        overallProgress: Number(formData.overallProgress),
        status: formData.status,
        budgetAllocated: Number(formData.budgetAllocated),
        budgetUsed: Number(formData.budgetUsed),
        fundingSources: formData.fundingSources.map((f) => ({
          name: f.name,
          amount: Number(f.amount)
        })),
        milestones: formData.milestones.map((m) => ({
          name: m.name,
          date: m.date,
          status: m.status
        }))
      };

      data.append(
        'project',
        new Blob([JSON.stringify(projectPayload)], { type: 'application/json' })
      );

      formData.blueprints.forEach((file) => data.append('blueprints', file));
      formData.additionalDocuments.forEach((file) => data.append('additionalDocuments', file));

      await axios.put(`${API_URL}/api/projects/${selectedProject.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Project Updated Successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update project. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedProject) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        No project selected.
      </div>
    );
  }

  return (
    <div className="edit-project-container">
      <div className="edit-project-header">
        <div>
          <button onClick={handleBack} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="page-title" style={{ marginTop: '12px' }}>
            Edit: {selectedProject.title}
          </h1>
          <p className="page-subtitle">Update project details and save changes</p>
        </div>
        <div className="header-actions">
          <button onClick={handleBack} className="cancel-btn">
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSubmit} className="submit-btn" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="content-container">
        <form onSubmit={handleSubmit} className="comprehensive-form">

          {/* 1. Project Overview */}
          <section className="form-card">
            <div className="card-header">
              <h3>1. Project Overview</h3>
              <span className="card-subtitle">Basic details, goals, and location data.</span>
            </div>
            <div className="form-grid">
              <div className="field-group span-2">
                <label>Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  placeholder="e.g., Mamelodi Community Clinic Construction"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="">Select Category...</option>
                  <option value="Clinics/Hospitals">Clinics/Hospitals</option>
                  <option value="Water & Sanitation">Water & Sanitation</option>
                  <option value="Energy & Electricity">Energy & Electricity</option>
                  <option value="Roads & Transport">Roads & Transport</option>
                </select>
              </div>
              <div className="field-group">
                <label>Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  placeholder="e.g., Department of Health"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field-group span-2">
                <label>Project Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  rows={3}
                  placeholder="Provide a detailed overview of the project's purpose..."
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group span-2">
                <label>Project Goals</label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  rows={2}
                  placeholder="What are the overarching goals?"
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group span-2">
                <label>Specific Objectives</label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  rows={2}
                  placeholder="List specific, measurable outcomes"
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group">
                <label>Location (City/Region)</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  placeholder="e.g., City of Tshwane"
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group">
                <label>GPS Coordinates</label>
                <input
                  type="text"
                  name="gpsCoordinates"
                  value={formData.gpsCoordinates}
                  placeholder="e.g., -25.7139, 28.3633"
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group">
                <label>Project Manager</label>
                <input
                  type="text"
                  name="projectManager"
                  value={formData.projectManager}
                  placeholder="e.g., Richard Ramashala"
                  onChange={handleInputChange}
                />
              </div>
              <div className="field-group">
                <label>Primary Contractor</label>
                <input
                  type="text"
                  name="contractor"
                  value={formData.contractor}
                  placeholder="e.g., Group Five Construction"
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          {/* 2. Timeline & Progress */}
          <section className="form-card">
            <div className="card-header">
              <h3>2. Timeline & Progress</h3>
              <span className="card-subtitle">Scheduling and current completion status.</span>
            </div>
            <div className="form-grid">
              <div className="field-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Expected Completion *</label>
                <input
                  type="date"
                  name="expectedCompletion"
                  value={formData.expectedCompletion}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Overall Progress ({formData.overallProgress}%)</label>
                <div className="range-container">
                  <input
                    type="range"
                    name="overallProgress"
                    min="0"
                    max="100"
                    value={formData.overallProgress}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Current Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Planning">Planning</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div className="dynamic-section">
              <h4>Milestone Timeline</h4>
              {formData.milestones.map((milestone, index) => (
                <div key={milestone.id} className="dynamic-row">
                  <input
                    type="text"
                    placeholder={`Milestone ${index + 1} Name`}
                    value={milestone.name}
                    onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                  />
                  <input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                  />
                  <select
                    value={milestone.status}
                    onChange={(e) => updateMilestone(milestone.id, 'status', e.target.value)}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMilestone(milestone.id)}
                    className="remove-row-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="text-button" onClick={addMilestone}>
                + Add Milestone
              </button>
            </div>
          </section>

          {/* 3. Budget & Financials */}
          <section className="form-card">
            <div className="card-header">
              <h3>3. Budget & Financials</h3>
              <span className="card-subtitle">Allocations, usage, and funding sources.</span>
            </div>
            <div className="form-grid">
              <div className="field-group">
                <label>Total Budget Allocated (ZAR) *</label>
                <input
                  type="number"
                  name="budgetAllocated"
                  value={formData.budgetAllocated}
                  placeholder="120000000"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Budget Used to Date (ZAR)</label>
                <input
                  type="number"
                  name="budgetUsed"
                  value={formData.budgetUsed}
                  placeholder="78000000"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="dynamic-section">
              <h4>Funding Sources</h4>
              {formData.fundingSources.map((source, index) => (
                <div key={source.id} className="dynamic-row">
                  <input
                    type="text"
                    placeholder={`Source ${index + 1}`}
                    value={source.name}
                    onChange={(e) => updateFundingSource(source.id, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Amount (ZAR)"
                    value={source.amount}
                    onChange={(e) => updateFundingSource(source.id, 'amount', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeFundingSource(source.id)}
                    className="remove-row-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="text-button" onClick={addFundingSource}>
                + Add Funding Source
              </button>
            </div>
          </section>

          {/* 4. Documents & Blueprints */}
          <section className="form-card">
            <div className="card-header">
              <h3>4. Documents & Blueprints</h3>
              <span className="card-subtitle">
                Upload project plans, site images, and architectural blueprints directly to this project profile.
              </span>
            </div>

            <div className="document-group" style={{ marginBottom: '30px' }}>
              <h4>Architectural Blueprints</h4>

              {selectedProject?.blueprintFileNames && selectedProject.blueprintFileNames.length > 0 && (
                <div className="file-preview-list">
                  <p className="file-list-label">Existing Blueprints:</p>
                  {selectedProject.blueprintFileNames.map((file, index) => (
                    <div key={`existing-bp-${index}`} className="file-preview-item">
                      <FileText size={18} className="doc-icon" />
                      <span className="file-name">{file}</span>
                      <a
                        href={`${API_URL}/uploads/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-link"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {formData.blueprints.length > 0 && (
                <div className="file-preview-list">
                  <p className="file-list-label">New Blueprints to Upload:</p>
                  {formData.blueprints.map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <FileText size={18} className="doc-icon" />
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'blueprints')}
                        className="remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="file-upload-container">
                <label className="file-upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'blueprints')}
                    className="hidden-input"
                  />
                  <div className="upload-content">
                    <Upload size={32} className="upload-icon" />
                    <p className="upload-text">
                      <strong>Click to upload blueprints</strong> or drag and drop
                    </p>
                    <p className="upload-hint">SVG, PNG, JPG or PDF (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="document-group">
              <h4>Additional Supporting Documents</h4>
              <p className="card-subtitle" style={{ marginBottom: '15px' }}>
                Upload legal contracts, environmental impact reports, or compliance certificates.
              </p>

              {selectedProject?.additionalDocumentNames && selectedProject.additionalDocumentNames.length > 0 && (
                <div className="file-preview-list">
                  <p className="file-list-label">Existing Documents:</p>
                  {selectedProject.additionalDocumentNames.map((file, index) => (
                    <div key={`existing-doc-${index}`} className="file-preview-item">
                      <FileText size={18} className="doc-icon" />
                      <span className="file-name">{file}</span>
                      <a
                        href={`${API_URL}/uploads/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-link"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {formData.additionalDocuments.length > 0 && (
                <div className="file-preview-list">
                  <p className="file-list-label">New Documents to Upload:</p>
                  {formData.additionalDocuments.map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <FileText size={18} className="doc-icon" />
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'additionalDocuments')}
                        className="remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="file-upload-container">
                <label className="file-upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'additionalDocuments')}
                    className="hidden-input"
                  />
                  <div className="upload-content">
                    <Upload size={32} className="upload-icon" />
                    <p className="upload-text">
                      <strong>Click to upload additional files</strong> or drag and drop
                    </p>
                    <p className="upload-hint">PDF, DOC, DOCX, PNG, JPG (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" onClick={handleBack} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}