// components/CreateProject.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../Components/CreateProject.css';

interface CreateProjectProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateProject({ onSuccess, onCancel }: CreateProjectProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    department: '',
    location: '',
    description: '',
    goals: '',          
    objectives: '',     
    projectManager: 'Richard Ramashala', 
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
    blueprints: [] as File[],
    additionalDocuments: [] as File[] 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        blueprints: [...prev.blueprints, ...newFiles]
      }));
    }
  };

  const removeBlueprint = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      blueprints: prev.blueprints.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleAdditionalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        additionalDocuments: [...prev.additionalDocuments, ...newFiles]
      }));
    }
  };

  const removeAdditionalDocument = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      additionalDocuments: prev.additionalDocuments.filter((_, index) => index !== indexToRemove)
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
      fundingSources: formData.fundingSources.map(f => f.id === id ? { ...f, [field]: value } : f)
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
      milestones: formData.milestones.map(m => m.id === id ? { ...m, [field]: value } : m)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        fundingSources: formData.fundingSources.map(f => ({
          name: f.name,
          amount: Number(f.amount)
        })),
        milestones: formData.milestones.map(m => ({
          name: m.name,
          date: m.date,
          status: m.status
        }))
      };

      // Append textual configuration block as JSON blob
      data.append(
        "project",
        new Blob([JSON.stringify(projectPayload)], { type: "application/json" })
      );

      // Append blueprint files
      formData.blueprints.forEach(file => {
        data.append("blueprints", file);
      });

      // Append additional supporting documents
      formData.additionalDocuments.forEach(file => {
        data.append("additionalDocuments", file);
      });

      const response = await axios.post("http://localhost:8080/api/projects", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("Server Response:", response.data);
      alert("Project Created Successfully!");
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        department: '',
        location: '',
        description: '',
        goals: '',          
        objectives: '',     
        projectManager: 'Richard Ramashala', 
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
        blueprints: [] as File[],
        additionalDocuments: [] as File[] 
      });

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Submission error details:", err);
      alert("Failed to save project. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-project-container">
      {/* Header */}
      <div className="create-project-header">
        <div>
          <h1 className="page-title">Create New Project</h1>
          <p className="page-subtitle">
            Initialize all project metrics, financials, timelines, and documentation for public transparency.
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        )}
      </div>

      <div className="content-container">
        <form onSubmit={handleSubmit} className="comprehensive-form">
          
          {/* CARD 1: Project Overview */}
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

          {/* CARD 2: Timeline & Progress */}
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
                </div>
              ))}
              <button type="button" className="text-button" onClick={addMilestone}>
                + Add Milestone
              </button>
            </div>
          </section>

          {/* CARD 3: Budget & Financials */}
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
                </div>
              ))}
              <button type="button" className="text-button" onClick={addFundingSource}>
                + Add Funding Source
              </button>
            </div>
          </section>

          {/* CARD 4: Documents & Blueprints */}
          <section className="form-card">
            <div className="card-header">
              <h3>4. Documents & Blueprints</h3>
              <span className="card-subtitle">Upload project plans, site images, and architectural blueprints directly to this project profile.</span>
            </div>
            
            {/* Blueprints Section */}
            <div className="document-group" style={{ marginBottom: '30px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: '#333' }}>Architectural Blueprints</h4>
              
              {formData.blueprints.length > 0 && (
                <div className="file-preview-list" style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                    Attached Blueprints ({formData.blueprints.length}):
                  </p>
                  {formData.blueprints.map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <svg className="doc-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="file-name">{file.name}</span>
                      <button type="button" onClick={() => removeBlueprint(index)} className="remove-file-btn">
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
                    onChange={handleFileChange} 
                    className="hidden-input" 
                  />
                  <div className="upload-content">
                    <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="upload-text"><strong>Click to upload blueprints</strong> or drag and drop</p>
                    <p className="upload-hint">SVG, PNG, JPG or PDF (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Supporting Documents Section */}
            <div className="document-group" style={{ borderTop: '1px solid #eaeaea', paddingTop: '25px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: '#333' }}>Additional Supporting Documents</h4>
              <p className="card-subtitle" style={{ marginBottom: '15px' }}>
                Upload legal contracts, environmental impact reports, or compliance certificates.
              </p>
              
              {formData.additionalDocuments.length > 0 && (
                <div className="file-preview-list" style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                    Attached Additional Documents ({formData.additionalDocuments.length}):
                  </p>
                  {formData.additionalDocuments.map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <svg className="doc-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="file-name">{file.name}</span>
                      <button type="button" onClick={() => removeAdditionalDocument(index)} className="remove-file-btn">
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
                    onChange={handleAdditionalFileChange} 
                    className="hidden-input" 
                  />
                  <div className="upload-content">
                    <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="upload-text"><strong>Click to upload additional files</strong> or drag and drop</p>
                    <p className="upload-hint">PDF, DOC, DOCX, PNG, JPG (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}