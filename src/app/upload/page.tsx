'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Camera, ArrowLeft, CheckCircle, AlertCircle, Loader2, Wifi, Clock } from 'lucide-react'
import { processImageForBikeFit, waitForMediaPipe } from '@/lib/poseAnalysis'
import { PoseAnalysis } from '@/types'

interface PhotoUpload {
  file: File
  position: '6-oclock' | '3-oclock'
  analysis?: PoseAnalysis
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState('')
  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const [mediaPipeError, setMediaPipeError] = useState('')
  const [currentUploadPosition, setCurrentUploadPosition] = useState<'6-oclock' | '3-oclock'>('6-oclock')

  // Check MediaPipe availability on component mount
  useEffect(() => {
    const checkMediaPipe = async () => {
      try {
        setAnalysisProgress('Loading AI libraries...')
        await waitForMediaPipe(15000) // 15 second timeout
        setMediaPipeReady(true)
        setAnalysisProgress('')
      } catch (error: any) {
        setMediaPipeError('Failed to load AI libraries. Please refresh the page and ensure you have a stable internet connection.')
        setAnalysisProgress('')
      }
    }

    checkMediaPipe()
  }, [])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const validFiles = Array.from(files).filter(file => {
      return file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    })
    
    if (validFiles.length === 0) return

    const newPhoto: PhotoUpload = {
      file: validFiles[0],
      position: currentUploadPosition
    }
    
    setPhotos(prev => {
      // Remove existing photo of same position if it exists
      const filtered = prev.filter(p => p.position !== currentUploadPosition)
      return [...filtered, newPhoto]
    })

    // Auto-switch to next needed position
    if (currentUploadPosition === '6-oclock' && !photos.some(p => p.position === '3-oclock')) {
      setCurrentUploadPosition('3-oclock')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removePhoto = (position: '6-oclock' | '3-oclock') => {
    setPhotos(prev => prev.filter(p => p.position !== position))
  }

  const getPhotoByPosition = (position: '6-oclock' | '3-oclock') => {
    return photos.find(p => p.position === position)
  }

  const handleAnalyze = async () => {
    if (photos.length < 2 || !mediaPipeReady) return
    
    setAnalyzing(true)
    setAnalysisProgress('Initializing AI pose detection...')
    
    try {
      const analyzedPhotos: PhotoUpload[] = []
      
      // Process each photo
      for (const photo of photos) {
        setAnalysisProgress(`Analyzing ${photo.position === '6-oclock' ? '6 o\'clock' : '3 o\'clock'} position...`)
        
        try {
          const poseAnalysis = await processImageForBikeFit(photo.file, photo.position)
          analyzedPhotos.push({
            ...photo,
            analysis: poseAnalysis
          })
        } catch (error: any) {
          throw new Error(`Failed to analyze ${photo.position} photo: ${error.message}`)
        }
      }
      
      setAnalysisProgress('Calculating comprehensive bike fit recommendations...')
      
      // Send both analyses to the API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          photos: analyzedPhotos.map(p => ({
            position: p.position,
            analysis: p.analysis
          })),
          isRealAnalysis: true 
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        // Store results and navigate to results page
        localStorage.setItem('analysisResult', JSON.stringify(result))
        setAnalysisProgress('Analysis complete!')
        
        setTimeout(() => {
          router.push('/results')
        }, 500)
      } else {
        throw new Error('Failed to process analysis results')
      }
      
    } catch (error: any) {
      console.error('Analysis error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to analyze images. Please try again.'
      
      if (error.message.includes('No pose detected')) {
        errorMessage = 'No person detected in one of the images. Please ensure you are clearly visible in both side-view positions.'
      } else if (error.message.includes('side-view')) {
        errorMessage = 'Please take both photos from the side (90° angle) showing your full riding position.'
      } else if (error.message.includes('landmarks') || error.message.includes('body parts')) {
        errorMessage = 'Could not detect all body parts clearly in one of the photos. Please ensure good lighting and clear view of your riding position.'
      } else if (error.message.includes('MediaPipe')) {
        errorMessage = 'AI libraries not ready. Please refresh the page and try again.'
      }
      
      alert(errorMessage)
    } finally {
      setAnalyzing(false)
      setAnalysisProgress('')
    }
  }

  const hasRequiredPhotos = photos.length === 2 && 
    photos.some(p => p.position === '6-oclock') && 
    photos.some(p => p.position === '3-oclock')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Riding Photos
          </h1>
          <p className="text-gray-600">
            Take 2 side-view photos at different pedal positions for comprehensive analysis
          </p>
        </div>

        {/* MediaPipe Status */}
        {!mediaPipeReady && (
          <div className="mb-6">
            {mediaPipeError ? (
              <div className="card bg-red-50 border-red-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">AI Libraries Error</p>
                    <p className="text-sm text-red-700">{mediaPipeError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900">Loading AI Libraries</p>
                    <p className="text-sm text-blue-700">Preparing MediaPipe pose detection...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Two-Photo Analysis System</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                    <Clock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center">
                      Photo 1: 6 O'Clock Position
                      {getPhotoByPosition('6-oclock') && <CheckCircle className="w-4 h-4 text-green-500 ml-2" />}
                    </h3>
                    <p className="text-sm text-gray-600">Pedal at bottom (knee extension) - measures saddle height, torso angle, elbow extension</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                    <Clock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center">
                      Photo 2: 3 O'Clock Position
                      {getPhotoByPosition('3-oclock') && <CheckCircle className="w-4 h-4 text-green-500 ml-2" />}
                    </h3>
                    <p className="text-sm text-gray-600">Pedal forward (horizontal) - measures KOPS alignment and postural consistency</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Photo Requirements</h2>
              
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Camera positioned 6-8 feet away
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Complete side view (90° angle)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Good lighting, clear image
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Wear fitted clothing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Natural riding position
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Hold each pedal position for clear photo
                </li>
              </ul>
            </div>

            {/* AI Status */}
            <div className={`card ${mediaPipeReady ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`font-semibold mb-2 ${mediaPipeReady ? 'text-green-900' : 'text-blue-900'}`}>
                🤖 AI-Powered Analysis {mediaPipeReady && '✓'}
              </h3>
              <p className={`text-sm ${mediaPipeReady ? 'text-green-700' : 'text-blue-700'}`}>
                {mediaPipeReady 
                  ? 'Advanced two-photo analysis ready! This system will analyze your pose across different pedal positions for comprehensive bike fit recommendations.'
                  : 'Loading Google\'s MediaPipe technology for advanced multi-position pose analysis.'
                }
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-6">
            {/* Position Selector */}
            <div className="card">
              <h3 className="font-medium mb-4">Select Photo Position to Upload</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentUploadPosition('6-oclock')}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    currentUploadPosition === '6-oclock'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  6 O'Clock
                  {getPhotoByPosition('6-oclock') && <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />}
                </button>
                <button
                  onClick={() => setCurrentUploadPosition('3-oclock')}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    currentUploadPosition === '3-oclock'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  3 O'Clock
                  {getPhotoByPosition('3-oclock') && <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />}
                </button>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`card border-2 border-dashed transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : mediaPipeReady 
                  ? 'border-gray-300 hover:border-primary-400' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => mediaPipeReady && fileInputRef.current?.click()}
            >
              <div className="text-center py-8">
                <Upload className={`w-12 h-12 mx-auto mb-4 ${mediaPipeReady ? 'text-gray-400' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-medium mb-2 ${mediaPipeReady ? 'text-gray-900' : 'text-gray-500'}`}>
                  Upload {currentUploadPosition === '6-oclock' ? '6 O\'Clock' : '3 O\'Clock'} Photo
                </h3>
                <p className={`text-sm mb-4 ${mediaPipeReady ? 'text-gray-500' : 'text-gray-400'}`}>
                  Drop image here or click to browse (JPG, PNG up to 10MB)
                </p>
                <div className="flex justify-center space-x-4">
                  <button 
                    className={`btn-primary ${!mediaPipeReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!mediaPipeReady}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Choose File
                  </button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={!mediaPipeReady}
              />
            </div>

            {/* Uploaded Photos Status */}
            <div className="space-y-3">
              {(['6-oclock', '3-oclock'] as const).map((position) => {
                const photo = getPhotoByPosition(position)
                return (
                  <div key={position} className={`card ${photo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className={`w-5 h-5 ${photo ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className={`font-medium ${photo ? 'text-green-900' : 'text-gray-700'}`}>
                            {position === '6-oclock' ? '6 O\'Clock Position' : '3 O\'Clock Position'}
                          </h4>
                          {photo ? (
                            <p className="text-sm text-green-700">{photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(1)} MB)</p>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded yet</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {photo ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removePhoto(position)
                              }}
                              className="text-red-500 hover:text-red-700"
                              disabled={analyzing}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Analysis Progress */}
            {analyzing && analysisProgress && (
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <div>
                    <p className="font-medium text-primary-900">Analyzing Your Bike Fit</p>
                    <p className="text-sm text-primary-700">{analysisProgress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!hasRequiredPhotos || analyzing || !mediaPipeReady}
              className={`w-full btn-primary flex items-center justify-center ${
                (!hasRequiredPhotos || analyzing || !mediaPipeReady) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : !mediaPipeReady ? (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Loading AI Libraries...
                </>
              ) : !hasRequiredPhotos ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Upload Both Photos
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Analyze My Bike Fit
                </>
              )}
            </button>

            {!hasRequiredPhotos && mediaPipeReady && (
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Please upload both 6 o'clock and 3 o'clock position photos for comprehensive analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 