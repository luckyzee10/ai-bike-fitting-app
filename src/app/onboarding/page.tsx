'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, User, Target, AlertCircle } from 'lucide-react'
import { UserData } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [userData, setUserData] = useState<Partial<UserData>>({
    goals: [],
    painAreas: [],
  })

  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save to localStorage and proceed to upload
      localStorage.setItem('userData', JSON.stringify(userData))
      router.push('/upload')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push('/')
    }
  }

  const updateUserData = (field: keyof UserData, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'goals' | 'painAreas', value: string) => {
    setUserData(prev => {
      const currentArray = prev[field] || []
      const typedValue = value as UserData[typeof field][0]
      const newArray = currentArray.includes(typedValue)
        ? currentArray.filter(item => item !== typedValue)
        : [...currentArray, typedValue]
      return { ...prev, [field]: newArray }
    })
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return userData.height && userData.weight && userData.inseam
      case 2:
        return userData.ridingStyle
      case 3:
        return userData.goals && userData.goals.length > 0
      case 4:
        return true // Pain areas are optional
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-6">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      i + 1 < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Let's Get Your Perfect Fit
          </h1>
          <p className="text-gray-600 mt-2">
            Step {currentStep} of {totalSteps}: Tell us about yourself
          </p>
        </div>

        {/* Step Content */}
        <div className="card">
          {/* Step 1: Physical Measurements */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold">Physical Measurements</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="175"
                    value={userData.height || ''}
                    onChange={(e) => updateUserData('height', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="70"
                    value={userData.weight || ''}
                    onChange={(e) => updateUserData('weight', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inseam (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="81"
                    value={userData.inseam || ''}
                    onChange={(e) => updateUserData('inseam', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Measure from floor to crotch while standing against a wall
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Riding Style */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center mb-6">
                <Target className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold">Riding Style</h2>
              </div>
              
              <p className="text-gray-600 mb-4">What type of cycling do you primarily do?</p>
              
              <div className="space-y-3">
                {[
                  { value: 'road', label: 'Road Cycling', description: 'Drop bars, racing or endurance' },
                  { value: 'gravel', label: 'Gravel/Adventure', description: 'Mixed terrain, drop bars' },
                  { value: 'mtb', label: 'Mountain Biking', description: 'Off-road, flat or riser bars' },
                  { value: 'hybrid', label: 'Hybrid/Commuter', description: 'Flat bars, upright position' },
                ].map((style) => (
                  <label
                    key={style.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      userData.ridingStyle === style.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ridingStyle"
                      value={style.value}
                      checked={userData.ridingStyle === style.value}
                      onChange={(e) => updateUserData('ridingStyle', e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-medium">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-6">
                <Target className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold">Your Goals</h2>
              </div>
              
              <p className="text-gray-600 mb-4">What are you hoping to achieve? (Select all that apply)</p>
              
              <div className="space-y-3">
                {[
                  { value: 'comfort', label: 'Comfort', description: 'Reduce pain and discomfort while riding' },
                  { value: 'performance', label: 'Performance', description: 'Improve speed, power, and efficiency' },
                  { value: 'endurance', label: 'Endurance', description: 'Ride longer distances comfortably' },
                ].map((goal) => (
                  <label
                    key={goal.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      userData.goals?.includes(goal.value as any)
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={userData.goals?.includes(goal.value as any) || false}
                      onChange={() => toggleArrayField('goals', goal.value)}
                      className="sr-only"
                    />
                    <div className="font-medium">{goal.label}</div>
                    <div className="text-sm text-gray-500">{goal.description}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pain Areas */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-center mb-6">
                <AlertCircle className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold">Areas of Discomfort</h2>
              </div>
              
              <p className="text-gray-600 mb-4">Do you experience pain or discomfort in any of these areas? (Optional)</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'neck', label: 'Neck' },
                  { value: 'shoulders', label: 'Shoulders' },
                  { value: 'back', label: 'Lower Back' },
                  { value: 'knees', label: 'Knees' },
                  { value: 'hands', label: 'Hands/Wrists' },
                  { value: 'saddle', label: 'Saddle Area' },
                ].map((area) => (
                  <label
                    key={area.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                      userData.painAreas?.includes(area.value as any)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={userData.painAreas?.includes(area.value as any) || false}
                      onChange={() => toggleArrayField('painAreas', area.value)}
                      className="sr-only"
                    />
                    <div className="font-medium">{area.label}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`btn-primary flex items-center ${
                !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {currentStep === totalSteps ? 'Continue to Upload' : 'Next'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 