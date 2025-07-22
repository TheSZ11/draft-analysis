import React from 'react';
import { useUIContext } from '../contexts/index.js';

/**
 * ComplianceReportModal Component - Shows league compliance report for a team
 * Now uses React Context instead of prop drilling
 * @returns {JSX.Element}
 */
export const ComplianceReportModal = () => {
  // Get data from contexts instead of props
  const {
    showComplianceReport,
    complianceReportData,
    hideComplianceReportModal
  } = useUIContext();
  if (!showComplianceReport || !complianceReportData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-100">League Compliance Report</h2>
              <p className="text-slate-400 mt-1">
                {complianceReportData.team.name} • Score: {complianceReportData.compliance.complianceScore}/100
              </p>
            </div>
            <button
              onClick={hideComplianceReportModal}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Compliance Status */}
          <div className={`p-4 rounded-lg mb-4 ${
            complianceReportData.compliance.isFullyCompliant 
              ? 'bg-green-900/50 border border-green-600' 
              : 'bg-red-900/50 border border-red-600'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {complianceReportData.compliance.isFullyCompliant ? '✅' : '❌'}
              </span>
              <span className="font-semibold text-slate-100">
                {complianceReportData.compliance.isFullyCompliant 
                  ? 'FULLY COMPLIANT' 
                  : 'NON-COMPLIANT'
                }
              </span>
              <span className="text-slate-300">
                ({complianceReportData.compliance.complianceScore}/100)
              </span>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-100">
                {complianceReportData.compliance.summary.totalPlayers}
              </div>
              <div className="text-xs text-slate-400">Total Players</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-100">
                {complianceReportData.compliance.summary.activePlayers}
              </div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-100">
                {complianceReportData.compliance.summary.reservePlayers}
              </div>
              <div className="text-xs text-slate-400">Reserve</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-100">
                {complianceReportData.compliance.summary.injuredReservePlayers}
              </div>
              <div className="text-xs text-slate-400">Injured Reserve</div>
            </div>
          </div>
          
          {/* Detailed Report */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="font-semibold text-slate-100 mb-2">Detailed Report</h3>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {complianceReportData.report}
            </pre>
          </div>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(complianceReportData.report);
                alert('Report copied to clipboard!');
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg transition-colors text-sm"
            >
              Copy Report
            </button>
            <button
              onClick={hideComplianceReportModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 