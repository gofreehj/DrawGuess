'use client';

import { useState } from 'react';
import { AICallLog } from '@/types/game';

interface CallLogDisplayProps {
  callLog?: AICallLog;
  isVisible: boolean;
  title?: string;
}

// CallLogDisplay component - Shows detailed LLM call information
export default function CallLogDisplay({ 
  callLog, 
  isVisible,
  title = "AI Call Log Details"
}: CallLogDisplayProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [showImageData, setShowImageData] = useState(false);

  if (!isVisible || !callLog) {
    return null;
  }

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'Free';
    if (cost < 0.001) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="call-log-display bg-white rounded-lg shadow-md border border-gray-200 animate-fade-in">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete LLM API call details including request and response data
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Call Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-600 mb-1">Provider & Model</div>
            <div className="text-lg font-bold text-blue-800">
              {callLog.provider.toUpperCase()}
            </div>
            <div className="text-sm text-blue-700 font-mono">
              {callLog.model}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm font-medium text-green-600 mb-1">Response Time</div>
            <div className="text-lg font-bold text-green-800">
              {formatResponseTime(callLog.responseData.responseTime)}
            </div>
            <div className="text-sm text-green-700">
              {callLog.responseData.tokensUsed || 'N/A'} tokens
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-medium text-purple-600 mb-1">Status & Cost</div>
            <div className={`text-lg font-bold ${callLog.success ? 'text-green-800' : 'text-red-800'}`}>
              {callLog.success ? '✓ Success' : '✗ Failed'}
            </div>
            <div className="text-sm text-purple-700">
              {formatCost(callLog.cost)}
            </div>
          </div>
        </div>

        {/* Request Data Section */}
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Request Data
            </h4>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Request Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Temperature:</span>
                <span className="ml-2 text-gray-800">{callLog.requestData.temperature || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Max Tokens:</span>
                <span className="ml-2 text-gray-800">{callLog.requestData.maxTokens || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Mode:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  🔒 Blind Test
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Image:</span>
                <span className="ml-2 text-green-600">✓ Included</span>
              </div>
            </div>



            {/* Full Prompt */}
            {callLog.requestData.fullPrompt && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-600">Full Text Prompt:</span>
                  <button
                    onClick={() => setShowFullPrompt(!showFullPrompt)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {showFullPrompt ? 'Hide' : 'Show'} Full Prompt
                  </button>
                </div>
                <div className="bg-gray-100 rounded p-3 text-sm text-gray-800 border font-mono">
                  {showFullPrompt 
                    ? callLog.requestData.fullPrompt
                    : truncateText(callLog.requestData.fullPrompt, 300)
                  }
                </div>
              </div>
            )}

            {/* Image Data Info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-600">Image Data:</span>
                <button
                  onClick={() => setShowImageData(!showImageData)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {showImageData ? 'Hide' : 'Show'} Image Info
                </button>
              </div>
              {showImageData && (
                <div className="bg-gray-100 rounded p-3 text-sm text-gray-800 border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Format:</span>
                      <span className="ml-2">Base64 PNG</span>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <span className="ml-2">600x400 pixels</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    📸 Image data is encoded as base64 and sent to the LLM for visual analysis
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Response Data Section */}
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Response Data
            </h4>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Parsed Response */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-600 mb-2">AI Guess:</div>
                <div className="bg-blue-50 rounded p-3 text-lg font-bold text-blue-800 border border-blue-200">
                  {callLog.responseData.guess}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600 mb-2">Confidence:</div>
                <div className="bg-green-50 rounded p-3 border border-green-200">
                  <div className="text-lg font-bold text-green-800">
                    {Math.round(callLog.responseData.confidence * 100)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(callLog.responseData.confidence * 100, 5)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            {callLog.responseData.reasoning && (
              <div>
                <div className="font-medium text-gray-600 mb-2">AI Reasoning:</div>
                <div className="bg-indigo-50 rounded p-3 text-sm text-indigo-800 border border-indigo-200 italic">
                  "{callLog.responseData.reasoning}"
                </div>
              </div>
            )}

            {/* Raw Response */}
            {callLog.responseData.rawResponse && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-600">Raw LLM Response:</span>
                  <button
                    onClick={() => setShowRawResponse(!showRawResponse)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {showRawResponse ? 'Hide' : 'Show'} Raw Response
                  </button>
                </div>
                {showRawResponse && (
                  <div className="bg-gray-100 rounded p-3 text-sm text-gray-800 border font-mono max-h-64 overflow-y-auto">
                    {callLog.responseData.rawResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reasoning Analysis */}
        {callLog.reasoningAnalysis && (
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Reasoning Analysis
              </h4>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600">Visual Features Mentioned:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    callLog.reasoningAnalysis.mentionsVisualFeatures 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {callLog.reasoningAnalysis.mentionsVisualFeatures ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600">Original Prompt Leaked:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    callLog.reasoningAnalysis.mentionsOriginalPrompt 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {callLog.reasoningAnalysis.mentionsOriginalPrompt ? '⚠️ Yes' : '✓ No'}
                  </span>
                </div>
              </div>

              {callLog.reasoningAnalysis.visualKeywords.length > 0 && (
                <div>
                  <div className="font-medium text-gray-600 mb-2">Visual Keywords Found:</div>
                  <div className="flex flex-wrap gap-2">
                    {callLog.reasoningAnalysis.visualKeywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {callLog.reasoningAnalysis.confidenceFactors.length > 0 && (
                <div>
                  <div className="font-medium text-gray-600 mb-2">Confidence Factors:</div>
                  <div className="flex flex-wrap gap-2">
                    {callLog.reasoningAnalysis.confidenceFactors.map((factor, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Information */}
        {!callLog.success && callLog.error && (
          <div className="border border-red-200 rounded-lg bg-red-50">
            <div className="bg-red-100 px-4 py-3 border-b border-red-200">
              <h4 className="text-md font-semibold text-red-800 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error Details
              </h4>
            </div>
            <div className="p-4">
              <div className="text-sm text-red-800 font-mono bg-white rounded p-3 border border-red-200">
                {callLog.error}
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Called at: {formatTimestamp(callLog.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}