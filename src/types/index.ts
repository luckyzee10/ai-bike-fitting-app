export interface UserData {
  height: number // in cm
  weight: number // in kg
  inseam: number // in cm
  ridingStyle: 'road' | 'gravel' | 'mtb' | 'hybrid'
  goals: ('comfort' | 'performance' | 'endurance')[]
  painAreas: ('neck' | 'shoulders' | 'back' | 'knees' | 'hands' | 'saddle')[]
}

// MediaPipe landmark structure
export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface PoseAnalysis {
  kneeAngle: number
  torsoAngle: number
  elbowAngle: number
  reachDistance: number
  saddleHeight: number
  // Visual feedback data
  landmarks?: Landmark[]
  imageData?: string // base64 data URL of original image
  imageWidth?: number
  imageHeight?: number
  // Position context for accurate analysis
  pedalPosition?: '6-oclock' | '3-oclock'
}

// Enhanced analysis for two-photo system
export interface PhotoAnalysis {
  position: '6-oclock' | '3-oclock'
  analysis: PoseAnalysis
}

export interface KOPSAnalysis {
  kneePosition: { x: number; y: number }
  pedalPosition: { x: number; y: number }
  horizontalOffset: number // in cm, positive = knee ahead of pedal
  isOptimal: boolean
}

export interface PosturalConsistency {
  torsoAngleDifference: number
  elbowAngleDifference: number
  isConsistent: boolean
  issues: string[]
}

export interface EnhancedAnalysisResult {
  sixOClockAnalysis: PoseAnalysis
  threeOClockAnalysis: PoseAnalysis
  kopsAnalysis: KOPSAnalysis
  posturalConsistency: PosturalConsistency
  recommendations: FitRecommendation[]
  overallScore: number
  summary: string
}

export interface FitRecommendation {
  type: 'saddle_height' | 'saddle_fore_aft' | 'handlebar_height' | 'stem_length' | 'cleat_position' | 'core_stability'
  currentValue: number
  recommendedValue: number
  adjustment: string
  priority: 'high' | 'medium' | 'low'
  description: string
  basedOn: 'knee_angle' | 'torso_angle' | 'elbow_angle' | 'kops' | 'postural_consistency'
}

// Legacy interface for backward compatibility
export interface AnalysisResult {
  angles: PoseAnalysis
  recommendations: FitRecommendation[]
  overallScore: number
  summary: string
} 