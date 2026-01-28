'use client';

import React from 'react';
import Modal from './Modal';

interface AnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  skills: string[];
  existingSkills?: string[];
  onAddSkills?: () => void;
}

export default function AnalysisResultModal({
  isOpen,
  onClose,
  summary,
  skills,
  existingSkills = [],
  onAddSkills,
}: AnalysisResultModalProps) {
  // Determine which skills are new vs existing
  const existingSkillNames = new Set(existingSkills.map(s => s.toLowerCase()));
  const newSkills = skills.filter(skill => !existingSkillNames.has(skill.toLowerCase()));
  const duplicateSkills = skills.filter(skill => existingSkillNames.has(skill.toLowerCase()));
  // Clean up summary - remove technical font metadata
  const cleanSummary = summary
    .replace(/\/[A-Za-z0-9\-]+\/[A-Za-z0-9\s\/\[\]<>=\-]+>/g, '') // Remove font metadata
    .replace(/Name:\s*\/[^/]+/g, '') // Remove font name metadata
    .replace(/Flags\s+\d+/g, '')
    .replace(/ItalicAngle\s+\d+/g, '')
    .replace(/Ascent\s+\d+/g, '')
    .replace(/Descent\s+-\d+/g, '')
    .replace(/CapHeight\s+\d+/g, '')
    .replace(/AvgWidth\s+\d+/g, '')
    .replace(/MaxWidth\s+\d+/g, '')
    .replace(/FontWeight\s+\d+/g, '')
    .replace(/XHeight\s+\d+/g, '')
    .replace(/Leading\s+\d+/g, '')
    .replace(/StemV\s+\d+/g, '')
    .replace(/FontBBox\[[^\]]+\]/g, '')
    .replace(/FontFile\d+\s+\d+\s+\d+\s+R>/g, '')
    .replace(/>\s*>/g, '')
    .trim();

  // Parse summary into structured data
  const lines = cleanSummary.split('\n').filter(line => line.trim());
  const summaryData: Record<string, string> = {};
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      if (value && !value.includes('/') && value.length < 100) {
        summaryData[key.trim()] = value;
      }
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Analysis Results" size="lg">
      <div className="space-y-6">
        {/* Summary Section */}
        {Object.keys(summaryData).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Summary
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {Object.entries(summaryData).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3">
                  <span className="font-medium text-gray-700 min-w-[100px]">{key}:</span>
                  <span className="text-gray-900 flex-1">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Extracted Skills ({skills.length})
            </h3>
            
            {/* New Skills */}
            {newSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">New Skills ({newSkills.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {newSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Duplicate Skills */}
            {duplicateSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Already in Your List ({duplicateSkills.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {duplicateSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium line-through"
                      title="This skill already exists in your skills list"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {onAddSkills && newSkills.length > 0 && (
              <button
                onClick={onAddSkills}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add {newSkills.length} New Skill{newSkills.length > 1 ? 's' : ''} to Skills Page
              </button>
            )}
            
            {newSkills.length === 0 && duplicateSkills.length > 0 && (
              <div className="w-full px-4 py-3 bg-gray-50 text-gray-600 rounded-lg text-sm text-center">
                All extracted skills are already in your skills list.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
