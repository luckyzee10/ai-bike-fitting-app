import { NextRequest, NextResponse } from 'next/server'
import { 
  AnalysisResult, 
  EnhancedAnalysisResult, 
  PoseAnalysis, 
  FitRecommendation, 
  PhotoAnalysis,
  KOPSAnalysis,
  PosturalConsistency,
  Landmark
} from '@/types'

// KOPS analysis from 3 o'clock position
function calculateKOPS(landmarks: Landmark[], imageWidth?: number): KOPSAnalysis {
  const POSE_LANDMARKS = {
    RIGHT_HIP: 23,
    RIGHT_KNEE: 25,
    RIGHT_ANKLE: 27,
  }

  const knee = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  const ankle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE] // Represents pedal axle position
  
  if (!knee || !ankle) {
    throw new Error('Could not detect knee or ankle for KOPS analysis')
  }

  // Calculate horizontal offset in pixels, then convert to cm
  const horizontalOffset = (knee.x - ankle.x) * (imageWidth || 640) * 0.05 // Rough conversion
  
  return {
    kneePosition: { x: knee.x, y: knee.y },
    pedalPosition: { x: ankle.x, y: ankle.y },
    horizontalOffset,
    isOptimal: Math.abs(horizontalOffset) <= 2 // Within 2cm is optimal
  }
}

// Analyze postural consistency between two photos
function analyzePosturalConsistency(
  sixOClockAnalysis: PoseAnalysis, 
  threeOClockAnalysis: PoseAnalysis
): PosturalConsistency {
  const torsoAngleDifference = Math.abs(sixOClockAnalysis.torsoAngle - threeOClockAnalysis.torsoAngle)
  const elbowAngleDifference = Math.abs(sixOClockAnalysis.elbowAngle - threeOClockAnalysis.elbowAngle)
  
  const issues: string[] = []
  
  if (torsoAngleDifference > 10) {
    issues.push('Significant torso angle variation between pedal positions suggests instability')
  }
  
  if (elbowAngleDifference > 15) {
    issues.push('Large elbow angle variation indicates excessive reach or poor core stability')
  }
  
  return {
    torsoAngleDifference,
    elbowAngleDifference,
    isConsistent: issues.length === 0,
    issues
  }
}

// Enhanced recommendation function with position-specific knee analysis
function generateEnhancedRecommendations(
  sixOClockAnalysis: PoseAnalysis,
  threeOClockAnalysis: PoseAnalysis,
  kopsAnalysis: KOPSAnalysis,
  posturalConsistency: PosturalConsistency
): FitRecommendation[] {
  const recommendations: FitRecommendation[] = []
  
  // Position-specific knee angle analysis
  // 6 O'Clock: Optimal 25-35° bend from straight (saddle height measurement)
  // 3 O'Clock: Optimal 70-90° bend from straight (not used for saddle height)
  
  console.log('Knee Analysis Debug:', {
    sixOClockKnee: sixOClockAnalysis.kneeAngle,
    threeOClockKnee: threeOClockAnalysis.kneeAngle,
    sixOClockPosition: sixOClockAnalysis.pedalPosition,
    threeOClockPosition: threeOClockAnalysis.pedalPosition
  })
  
  // Use 6 o'clock position for saddle height recommendations (25-35° optimal)
  if (sixOClockAnalysis.kneeAngle < 25) {
    recommendations.push({
      type: 'saddle_height',
      currentValue: sixOClockAnalysis.kneeAngle,
      recommendedValue: 30,
      adjustment: 'Raise saddle by 5-15mm',
      priority: 'high',
      description: `Your knee bend is ${sixOClockAnalysis.kneeAngle.toFixed(1)}° at bottom dead center, which is too straight. The saddle appears too high, reducing power output and potentially causing hip rocking.`,
      basedOn: 'knee_angle'
    })
  } else if (sixOClockAnalysis.kneeAngle > 35) {
    recommendations.push({
      type: 'saddle_height',
      currentValue: sixOClockAnalysis.kneeAngle,
      recommendedValue: 30,
      adjustment: 'Lower saddle by 5-15mm',
      priority: 'high',
      description: `Your knee bend is ${sixOClockAnalysis.kneeAngle.toFixed(1)}° at bottom dead center, which is too much bend. The saddle appears too low, limiting power generation and potentially causing knee strain.`,
      basedOn: 'knee_angle'
    })
  }
  
  // Validate 3 o'clock knee angle is reasonable (70-90° expected)
  if (threeOClockAnalysis.kneeAngle < 60 || threeOClockAnalysis.kneeAngle > 100) {
    console.warn('Unexpected 3 o\'clock knee angle:', threeOClockAnalysis.kneeAngle)
    // Don't add recommendation, but flag for review
  }
  
  // KOPS analysis (from 3 o'clock position)
  if (!kopsAnalysis.isOptimal) {
    if (kopsAnalysis.horizontalOffset > 2) {
      recommendations.push({
        type: 'saddle_fore_aft',
        currentValue: kopsAnalysis.horizontalOffset,
        recommendedValue: 0,
        adjustment: 'Move saddle backward 5-10mm',
        priority: 'medium',
        description: 'Your knee is too far forward over the pedal axle, which can reduce pedaling efficiency and cause anterior knee pain.',
        basedOn: 'kops'
      })
    } else if (kopsAnalysis.horizontalOffset < -2) {
      recommendations.push({
        type: 'saddle_fore_aft',
        currentValue: kopsAnalysis.horizontalOffset,
        recommendedValue: 0,
        adjustment: 'Move saddle forward 5-10mm',
        priority: 'medium',
        description: 'Your knee is too far behind the pedal axle, reducing power transfer and potentially overloading your lower back.',
        basedOn: 'kops'
      })
    }
  }
  
  // Torso angle analysis (average of both positions - optimal varies by discipline)
  const avgTorsoAngle = (sixOClockAnalysis.torsoAngle + threeOClockAnalysis.torsoAngle) / 2
  if (avgTorsoAngle < 35) {
    recommendations.push({
      type: 'handlebar_height',
      currentValue: avgTorsoAngle,
      recommendedValue: 45,
      adjustment: 'Raise handlebars by 10-20mm or use shorter stem',
      priority: 'medium',
      description: 'Very aggressive position detected. Consider raising handlebars for improved comfort and sustainable aerodynamics.',
      basedOn: 'torso_angle'
    })
  } else if (avgTorsoAngle > 55) {
    recommendations.push({
      type: 'handlebar_height',
      currentValue: avgTorsoAngle,
      recommendedValue: 45,
      adjustment: 'Lower handlebars by 10-20mm',
      priority: 'medium',
      description: 'Position is quite upright. Lowering handlebars will improve aerodynamics and power transfer.',
      basedOn: 'torso_angle'
    })
  }
  
  // Elbow angle analysis (average of both positions - optimal: 150-160 degrees)
  const avgElbowAngle = (sixOClockAnalysis.elbowAngle + threeOClockAnalysis.elbowAngle) / 2
  if (avgElbowAngle < 150) {
    recommendations.push({
      type: 'stem_length',
      currentValue: avgElbowAngle,
      recommendedValue: 155,
      adjustment: 'Try a longer stem (+10-20mm) or move saddle back',
      priority: 'medium',
      description: 'Arms are too bent, indicating the cockpit may be too short. This can cause discomfort and poor weight distribution.',
      basedOn: 'elbow_angle'
    })
  } else if (avgElbowAngle > 165) {
    recommendations.push({
      type: 'stem_length',
      currentValue: avgElbowAngle,
      recommendedValue: 155,
      adjustment: 'Try a shorter stem (-10-20mm) or move saddle forward',
      priority: 'medium',
      description: 'Arms are too straight/locked, indicating the cockpit may be too long. This reduces control and comfort.',
      basedOn: 'elbow_angle'
    })
  }
  
  // Postural consistency analysis
  if (!posturalConsistency.isConsistent) {
    recommendations.push({
      type: 'core_stability',
      currentValue: Math.max(posturalConsistency.torsoAngleDifference, posturalConsistency.elbowAngleDifference),
      recommendedValue: 5,
      adjustment: 'Focus on core strengthening and bike fit stability',
      priority: 'low',
      description: 'Significant postural variations detected between pedal positions. Consider core strengthening exercises and ensure your fit allows for stable, consistent positioning.',
      basedOn: 'postural_consistency'
    })
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

// Calculate overall score with position-specific considerations
function calculateEnhancedScore(
  sixOClockAnalysis: PoseAnalysis,
  threeOClockAnalysis: PoseAnalysis,
  kopsAnalysis: KOPSAnalysis,
  posturalConsistency: PosturalConsistency
): number {
  let score = 100
  
  // Primary deduction: 6 o'clock knee angle (most important for saddle height)
  if (sixOClockAnalysis.kneeAngle < 25 || sixOClockAnalysis.kneeAngle > 35) {
    const deviation = Math.min(Math.abs(sixOClockAnalysis.kneeAngle - 25), Math.abs(sixOClockAnalysis.kneeAngle - 35))
    score -= deviation * 2 // Heavy penalty for poor saddle height
  }
  
  // Secondary: 3 o'clock knee angle validation (should be 70-90°)
  if (threeOClockAnalysis.kneeAngle < 60 || threeOClockAnalysis.kneeAngle > 100) {
    score -= 10 // Moderate penalty for unexpected 3 o'clock position
  }
  
  const avgTorsoAngle = (sixOClockAnalysis.torsoAngle + threeOClockAnalysis.torsoAngle) / 2
  if (avgTorsoAngle < 35 || avgTorsoAngle > 55) {
    score -= Math.abs(avgTorsoAngle - 45) * 1
  }
  
  const avgElbowAngle = (sixOClockAnalysis.elbowAngle + threeOClockAnalysis.elbowAngle) / 2
  if (avgElbowAngle < 150 || avgElbowAngle > 165) {
    score -= Math.abs(avgElbowAngle - 157.5) * 0.5
  }
  
  // KOPS penalty
  if (!kopsAnalysis.isOptimal) {
    score -= Math.abs(kopsAnalysis.horizontalOffset) * 2
  }
  
  // Postural consistency penalty
  if (!posturalConsistency.isConsistent) {
    score -= (posturalConsistency.torsoAngleDifference + posturalConsistency.elbowAngleDifference) * 0.5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Legacy mock analysis function for backward compatibility
function generateMockAnalysis(): PoseAnalysis {
  return {
    kneeAngle: 28 + Math.random() * 10,
    torsoAngle: 40 + Math.random() * 20,
    elbowAngle: 150 + Math.random() * 15,
    reachDistance: 45 + Math.random() * 10,
    saddleHeight: 72 + Math.random() * 8,
  }
}

// Legacy recommendation function with corrected knee angle ranges
function generateLegacyRecommendations(angles: PoseAnalysis): FitRecommendation[] {
  const recommendations: FitRecommendation[] = []
  
  // Assume legacy analysis is 6 o'clock position
  if (angles.kneeAngle < 25) {
    recommendations.push({
      type: 'saddle_height',
      currentValue: angles.kneeAngle,
      recommendedValue: 30,
      adjustment: 'Raise saddle by 5-10mm',
      priority: 'high',
      description: `Your knee bend is ${angles.kneeAngle.toFixed(1)}° at bottom dead center, which is too straight. Consider raising the saddle.`,
      basedOn: 'knee_angle'
    })
  } else if (angles.kneeAngle > 35) {
    recommendations.push({
      type: 'saddle_height',
      currentValue: angles.kneeAngle,
      recommendedValue: 30,
      adjustment: 'Lower saddle by 5-10mm',
      priority: 'high',
      description: `Your knee bend is ${angles.kneeAngle.toFixed(1)}° at bottom dead center, which is too much bend. Consider lowering the saddle.`,
      basedOn: 'knee_angle'
    })
  }
  
  return recommendations
}

function calculateLegacyScore(angles: PoseAnalysis): number {
  let score = 100
  
  // Use corrected knee angle scoring (25-35° optimal)
  if (angles.kneeAngle < 25 || angles.kneeAngle > 35) {
    score -= Math.abs(angles.kneeAngle - 30) * 2
  }
  
  if (angles.torsoAngle < 35 || angles.torsoAngle > 55) {
    score -= Math.abs(angles.torsoAngle - 45) * 1
  }
  
  if (angles.elbowAngle < 150 || angles.elbowAngle > 160) {
    score -= Math.abs(angles.elbowAngle - 155) * 0.5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      
      // Check if this is the new two-photo analysis
      if (body.photos && Array.isArray(body.photos) && body.photos.length === 2) {
        console.log('🎯 Enhanced Two-Photo Analysis')
        
        const photoAnalyses: PhotoAnalysis[] = body.photos
        const sixOClockPhoto = photoAnalyses.find(p => p.position === '6-oclock')
        const threeOClockPhoto = photoAnalyses.find(p => p.position === '3-oclock')
        
        if (!sixOClockPhoto || !threeOClockPhoto) {
          return NextResponse.json(
            { error: 'Both 6 o\'clock and 3 o\'clock photos are required' },
            { status: 400 }
          )
        }
        
        const sixOClockAnalysis = sixOClockPhoto.analysis
        const threeOClockAnalysis = threeOClockPhoto.analysis
        
        // Calculate KOPS from 3 o'clock position
        let kopsAnalysis: KOPSAnalysis
        try {
          kopsAnalysis = calculateKOPS(
            threeOClockAnalysis.landmarks || [], 
            threeOClockAnalysis.imageWidth
          )
        } catch (error: any) {
          console.warn('KOPS calculation failed:', error.message)
          // Provide default KOPS analysis if calculation fails
          kopsAnalysis = {
            kneePosition: { x: 0.5, y: 0.5 },
            pedalPosition: { x: 0.5, y: 0.5 },
            horizontalOffset: 0,
            isOptimal: true
          }
        }
        
        // Analyze postural consistency
        const posturalConsistency = analyzePosturalConsistency(sixOClockAnalysis, threeOClockAnalysis)
        
        // Generate enhanced recommendations
        const recommendations = generateEnhancedRecommendations(
          sixOClockAnalysis,
          threeOClockAnalysis,
          kopsAnalysis,
          posturalConsistency
        )
        
        // Calculate overall score
        const overallScore = calculateEnhancedScore(
          sixOClockAnalysis,
          threeOClockAnalysis,
          kopsAnalysis,
          posturalConsistency
        )
        
        const result: EnhancedAnalysisResult = {
          sixOClockAnalysis,
          threeOClockAnalysis,
          kopsAnalysis,
          posturalConsistency,
          recommendations,
          overallScore,
          summary: overallScore >= 80 
            ? 'Excellent bike fit! Your two-position analysis shows consistent, optimal positioning.'
            : overallScore >= 60
            ? 'Good bike fit foundation. The comprehensive analysis identified specific areas for improvement.'
            : 'Comprehensive analysis reveals significant opportunities to optimize your bike fit for comfort and performance.'
        }
        
        // Return enhanced result directly (not legacy format)
        return NextResponse.json(result)
        
      } else if (body.angles) {
        // Legacy single-photo analysis
        console.log('📸 Legacy Single-Photo Analysis')
        const angles = body.angles
        const recommendations = generateLegacyRecommendations(angles)
        const overallScore = calculateLegacyScore(angles)
        
        const result: AnalysisResult = {
          angles,
          recommendations,
          overallScore,
          summary: body.isRealAnalysis 
            ? `${overallScore >= 80 
                ? 'Good bike fit! Consider upgrading to two-photo analysis for comprehensive recommendations.' 
                : overallScore >= 60
                ? 'Decent foundation. Upgrade to two-photo analysis for detailed KOPS and consistency evaluation.'
                : 'Single-photo analysis shows areas for improvement. Two-photo analysis recommended for complete assessment.'
              } (AI Analysis)`
            : overallScore >= 80 
              ? 'Great bike fit! Minor adjustments could optimize your position further.'
              : overallScore >= 60
              ? 'Good foundation with room for improvement.'
              : 'Significant adjustments needed for optimal comfort and performance.'
        }
        
        return NextResponse.json(result)
      }
    } else {
      // Legacy FormData approach
      console.log('📸 Using legacy FormData analysis')
      const formData = await request.formData()
      const files: File[] = []
      
      Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.startsWith('image') && value && typeof value === 'object' && 'arrayBuffer' in value) {
          files.push(value as File)
        }
      })
      
      if (files.length === 0) {
        return NextResponse.json(
          { error: 'No images provided' },
          { status: 400 }
        )
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      const angles = generateMockAnalysis()
      const recommendations = generateLegacyRecommendations(angles)
      const overallScore = calculateLegacyScore(angles)
      
      const result: AnalysisResult = {
        angles,
        recommendations,
        overallScore,
        summary: 'Mock analysis completed. Upload new photos for AI-powered analysis.'
      }
      
      return NextResponse.json(result)
    }
    
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze data. Please ensure you uploaded clear side-view photos.' },
      { status: 500 }
    )
  }
} 