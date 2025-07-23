'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RotateCcw,
  TrendingUp,
  Info,
  Eye,
  Clock,
  Activity
} from 'lucide-react'
import { AnalysisResult, EnhancedAnalysisResult, PoseAnalysis } from '@/types'
import PoseVisualization from '@/components/PoseVisualization'

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<AnalysisResult | EnhancedAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVisualization, setShowVisualization] = useState(true)
  const [activeVisualization, setActiveVisualization] = useState<'6-oclock' | '3-oclock'>('6-oclock')

  useEffect(() => {
    // Load analysis result from localStorage
    const storedResult = localStorage.getItem('analysisResult')
    if (storedResult) {
      setResult(JSON.parse(storedResult))
    } else {
      // No result found, redirect to upload
      router.push('/upload')
    }
    setLoading(false)
  }, [router])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'medium': return <Info className="w-5 h-5 text-yellow-600" />
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />
      default: return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getRecommendationBadge = (basedOn: string) => {
    const badges = {
      knee_angle: { label: 'Knee Angle', color: 'bg-green-100 text-green-800' },
      torso_angle: { label: 'Torso Angle', color: 'bg-purple-100 text-purple-800' },
      elbow_angle: { label: 'Elbow Angle', color: 'bg-yellow-100 text-yellow-800' },
      kops: { label: 'KOPS', color: 'bg-blue-100 text-blue-800' },
      postural_consistency: { label: 'Stability', color: 'bg-red-100 text-red-800' }
    }
    
    const badge = badges[basedOn as keyof typeof badges]
    return badge ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    ) : null
  }

  // Helper function to check if we have enhanced analysis
  const isEnhancedResult = (result: AnalysisResult | EnhancedAnalysisResult): result is EnhancedAnalysisResult => {
    return 'sixOClockAnalysis' in result && 'threeOClockAnalysis' in result
  }

  // Get the current analysis data based on active visualization
  const getCurrentAnalysis = (): PoseAnalysis => {
    if (!result) return {} as PoseAnalysis
    
    if (isEnhancedResult(result)) {
      return activeVisualization === '6-oclock' ? result.sixOClockAnalysis : result.threeOClockAnalysis
    } else {
      // Legacy format - always return the angles (assumed to be 6 o'clock)
      return result.angles
    }
  }

  // Get recommendations (same for both formats)
  const getRecommendations = () => {
    return result?.recommendations || []
  }

  // Get overall score (same for both formats)
  const getOverallScore = () => {
    return result?.overallScore || 0
  }

  // Get summary (same for both formats)
  const getSummary = () => {
    return result?.summary || ''
  }

  // Check if this is enhanced analysis
  const isEnhancedAnalysis = result && isEnhancedResult(result)

  // Check if visual feedback data is available for current analysis
  const currentAnalysis = getCurrentAnalysis()
  const hasVisualData = currentAnalysis?.landmarks && currentAnalysis?.imageData

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-4">Please upload and analyze your images first.</p>
          <button 
            onClick={() => router.push('/upload')}
            className="btn-primary"
          >
            Start Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </button>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
                Your Bike Fit Analysis
                {isEnhancedAnalysis && <span className="ml-3 px-3 py-1 bg-primary-600 text-slate-100 text-xs md:text-sm font-medium rounded-full whitespace-nowrap">Enhanced AI</span>}
              </h1>
              <p className="text-gray-600">
                {isEnhancedAnalysis 
                  ? 'Comprehensive two-position analysis with KOPS and stability assessment'
                  : 'Professional bike fit recommendations based on your riding position'
                }
              </p>
            </div>
            
            <div className="flex space-x-3 sm:ml-auto">
              <button className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button 
                onClick={() => router.push('/upload')}
                className="btn-primary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Analysis Features Banner */}
        {isEnhancedAnalysis && (
          <div className="mb-8">
            <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
              <div className="flex items-center space-x-4">
                <Activity className="w-8 h-8 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-primary-900">Enhanced Two-Position Analysis</h3>
                  <p className="text-sm text-primary-700">
                    This comprehensive analysis includes KOPS alignment, postural consistency, and multi-position biomechanics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Feedback Section */}
        {hasVisualData && (
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Eye className="w-6 h-6 text-primary-600 mr-3" />
                  Visual Analysis
                  <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded whitespace-nowrap">
                    {activeVisualization === '6-oclock' ? "6 O'Clock Position" : "3 O'Clock Position"}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:ml-auto">
                  {isEnhancedAnalysis && (
                    <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                      <button
                        onClick={() => setActiveVisualization('6-oclock')}
                        className={`flex items-center px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                          activeVisualization === '6-oclock'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        6 O'Clock
                      </button>
                      <button
                        onClick={() => setActiveVisualization('3-oclock')}
                        className={`flex items-center px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                          activeVisualization === '3-oclock'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        3 O'Clock
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowVisualization(!showVisualization)}
                    className="btn-secondary text-xs sm:text-sm whitespace-nowrap"
                  >
                    {showVisualization ? 'Hide' : 'Show'} Visualization
                  </button>
                </div>
              </div>
              
              {showVisualization && (
                <div className="mb-4">
                  <PoseVisualization
                    imageData={currentAnalysis.imageData!}
                    landmarks={currentAnalysis.landmarks!}
                    angles={{
                      kneeAngle: currentAnalysis.kneeAngle,
                      torsoAngle: currentAnalysis.torsoAngle,
                      elbowAngle: currentAnalysis.elbowAngle
                    }}
                    imageWidth={currentAnalysis.imageWidth}
                    imageHeight={currentAnalysis.imageHeight}
                    pedalPosition={activeVisualization}
                  />
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>🔬 AI-Powered Visual Analysis:</strong> The image above shows your actual riding position with AI-detected body landmarks and measured angles. 
                      Red dots indicate key body points, blue lines show the skeletal structure, and colored arcs display the measured angles with their values.
                      {isEnhancedAnalysis && (
                        <span className="block mt-1">
                          <strong>Enhanced Analysis:</strong> This is your {activeVisualization === '6-oclock' ? '6 o\'clock' : '3 o\'clock'} pedal position{activeVisualization === '6-oclock' ? ', used primarily for saddle height, torso angle, and elbow extension analysis' : ', used for KOPS alignment and postural consistency analysis'}.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Overall Score */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${getScoreBgColor(getOverallScore())}`}>
                <span className={`text-3xl font-bold ${getScoreColor(getOverallScore())}`}>
                  {getOverallScore()}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Fit Score</h2>
              <p className="text-gray-600 mb-4">{getSummary()}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Knee Angle:</span>
                  <span className="font-medium">{currentAnalysis.kneeAngle?.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Torso Angle:</span>
                  <span className="font-medium">{currentAnalysis.torsoAngle?.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Elbow Angle:</span>
                  <span className="font-medium">{currentAnalysis.elbowAngle?.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* Optimal Ranges Reference */}
            <div className="card mt-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 text-primary-600 mr-2" />
                Optimal Ranges
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {activeVisualization === '6-oclock' ? '6 O\'Clock' : '3 O\'Clock'}
                </span>
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Knee Bend Angle</span>
                    <span className="text-gray-500">
                      {activeVisualization === '3-oclock' ? '70° - 90°' : '25° - 35°'}
                      {activeVisualization === '3-oclock' && <span className="text-xs block">3 o&apos;clock expected</span>}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: activeVisualization === '3-oclock' 
                          ? `${Math.min(100, Math.max(0, ((currentAnalysis.kneeAngle - 60) / 40) * 100))}%`
                          : `${Math.min(100, Math.max(0, ((currentAnalysis.kneeAngle - 20) / 20) * 100))}%`,
                        backgroundColor: activeVisualization === '3-oclock'
                          ? (currentAnalysis.kneeAngle >= 70 && currentAnalysis.kneeAngle <= 90 ? '#10b981' : '#ef4444')
                          : (currentAnalysis.kneeAngle >= 25 && currentAnalysis.kneeAngle <= 35 ? '#10b981' : '#ef4444')
                      }}
                    ></div>
                  </div>
                  {activeVisualization === '6-oclock' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Primary measurement for saddle height
                    </p>
                  )}
                  {activeVisualization === '3-oclock' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Used for KOPS analysis, not saddle height
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Torso Angle</span>
                    <span className="text-gray-500">35° - 55°</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((currentAnalysis.torsoAngle - 30) / 30) * 100))}%`,
                        backgroundColor: currentAnalysis.torsoAngle >= 35 && currentAnalysis.torsoAngle <= 55 ? '#10b981' : '#ef4444'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Elbow Angle</span>
                    <span className="text-gray-500">150° - 165°</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((currentAnalysis.elbowAngle - 140) / 30) * 100))}%`,
                        backgroundColor: currentAnalysis.elbowAngle >= 150 && currentAnalysis.elbowAngle <= 165 ? '#10b981' : '#ef4444'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analysis Info */}
            {isEnhancedAnalysis && (
              <div className="card mt-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <h3 className="font-semibold mb-3 text-green-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Enhanced Features
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>KOPS Alignment Analysis</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Multi-Position Stability</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Postural Consistency</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Professional-Grade Analysis</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-primary-600 mr-3" />
                {isEnhancedAnalysis ? 'Comprehensive' : 'Personalized'} Recommendations
              </h2>
              
              {getRecommendations().length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellent Bike Fit!</h3>
                  <p className="text-gray-600">
                    Your bike position is within optimal ranges. No major adjustments needed.
                    {isEnhancedAnalysis && ' Your enhanced analysis shows consistent positioning across all pedal positions.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getRecommendations().map((rec, index) => (
                    <div key={index} className={`card border-l-4 ${getPriorityColor(rec.priority)} text-slate-900`}>
                      <div className="flex items-start space-x-4">
                        {getPriorityIcon(rec.priority)}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg capitalize text-slate-900">
                              {rec.type.replace('_', ' ')}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {(rec as any).basedOn && getRecommendationBadge((rec as any).basedOn)}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-slate-800 mb-3">{rec.description}</p>
                          
                          <div className="bg-white/70 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-slate-900 mb-1">
                              Recommended Adjustment:
                            </h4>
                            <p className="text-sm text-slate-800">{rec.adjustment}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="card mt-6">
              <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-600/20 rounded-full w-8 h-8 flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Make Adjustments</h4>
                    <p className="text-sm text-gray-600">
                      Follow the recommended adjustments above, making small changes (2-3mm) at a time.
                      {isEnhancedAnalysis && ' Prioritize high-priority items identified through comprehensive analysis.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-600/20 rounded-full w-8 h-8 flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Test & Re-analyze</h4>
                    <p className="text-sm text-gray-600">
                      Take new photos after adjustments and run another analysis to confirm improvements.
                      {isEnhancedAnalysis && ' Use the same two-position setup for accurate comparison.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-600/20 rounded-full w-8 h-8 flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Professional Consultation</h4>
                    <p className="text-sm text-gray-600">
                      For complex issues or persistent discomfort, consider visiting a certified bike fitter.
                      {isEnhancedAnalysis && ' Share this comprehensive analysis with your fitter for faster, more targeted adjustments.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 