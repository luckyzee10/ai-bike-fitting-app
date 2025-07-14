import { PoseAnalysis, Landmark } from '@/types'

// MediaPipe pose landmark indices
const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

interface PoseResults {
  poseLandmarks?: Landmark[]
}

// Helper function to calculate interior angle between three points
function calculateInteriorAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * 180.0 / Math.PI)
  
  if (angle > 180.0) {
    angle = 360 - angle
  }
  
  return angle
}

// Calculate knee bend angle (degrees from straight leg) - bike fitting standard
function calculateKneeBendAngle(hip: Landmark, knee: Landmark, ankle: Landmark): number {
  const interiorAngle = calculateInteriorAngle(hip, knee, ankle)
  // Convert interior angle to degrees of bend from straight leg
  return 180 - interiorAngle
}

// Helper function to calculate distance between two points
function calculateDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

// Enhanced analysis with position-specific measurements
export function analyzeBikeFit(
  landmarks: Landmark[], 
  pedalPosition: '6-oclock' | '3-oclock' = '6-oclock',
  imageElement?: HTMLImageElement
): PoseAnalysis {
  if (!landmarks || landmarks.length < 33) {
    throw new Error('Insufficient pose landmarks detected')
  }

  // Get relevant landmarks (use right side for consistency)
  const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const elbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
  const wrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
  const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
  const knee = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  const ankle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]

  // Validate that we have all required landmarks
  if (!shoulder || !elbow || !wrist || !hip || !knee || !ankle) {
    throw new Error('Could not detect all required body parts')
  }

  // Calculate knee bend angle (degrees from straight) - position-specific
  const kneeBendAngle = calculateKneeBendAngle(hip, knee, ankle)
  
  // Log for debugging
  console.log(`${pedalPosition} Knee Analysis:`, {
    interiorAngle: calculateInteriorAngle(hip, knee, ankle),
    bendAngle: kneeBendAngle,
    position: pedalPosition
  })

  // Calculate torso angle (shoulder-hip relative to vertical)
  const verticalReference = { x: hip.x, y: hip.y - 0.1, z: hip.z }
  const torsoAngle = calculateInteriorAngle(verticalReference, hip, shoulder)

  // Calculate elbow angle (interior angle - this one is correct as-is)
  const elbowAngle = calculateInteriorAngle(shoulder, elbow, wrist)

  // Calculate reach distance (shoulder to wrist horizontal distance)
  const reachDistance = Math.abs(shoulder.x - wrist.x) * 100

  // Estimate saddle height based on hip-to-ankle distance
  const saddleHeight = calculateDistance(hip, ankle) * 100

  const analysis: PoseAnalysis = {
    kneeAngle: Math.round(kneeBendAngle * 10) / 10, // Now properly measuring bend from straight
    torsoAngle: Math.round(torsoAngle * 10) / 10,
    elbowAngle: Math.round(elbowAngle * 10) / 10,
    reachDistance: Math.round(reachDistance * 10) / 10,
    saddleHeight: Math.round(saddleHeight * 10) / 10,
    // Include visual feedback data
    landmarks: landmarks,
    imageWidth: imageElement?.naturalWidth || imageElement?.width,
    imageHeight: imageElement?.naturalHeight || imageElement?.height,
    // Add pedal position for context
    pedalPosition
  }

  return analysis
}

// Check if MediaPipe is loaded
function isMediaPipeLoaded(): boolean {
  return typeof window !== 'undefined' && 
         'Pose' in window && 
         'drawConnectors' in window &&
         'drawLandmarks' in window
}

// Process image and get pose analysis with pedal position context
export async function processImageForBikeFit(
  imageFile: File, 
  pedalPosition: '6-oclock' | '3-oclock' = '6-oclock'
): Promise<PoseAnalysis> {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if MediaPipe is available
      if (!isMediaPipeLoaded()) {
        reject(new Error('MediaPipe libraries not loaded. Please refresh the page and try again.'))
        return
      }

      // Create image element
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          // Initialize MediaPipe Pose using global objects
          const pose = new (window as any).Pose({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            }
          })

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          })

          // Set up results handler
          pose.onResults((results: PoseResults) => {
            if (results.poseLandmarks && results.poseLandmarks.length > 0) {
              try {
                const analysis = analyzeBikeFit(results.poseLandmarks, pedalPosition, img)
                
                // Add image data URL for visual feedback
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                
                if (ctx) {
                  canvas.width = img.naturalWidth
                  canvas.height = img.naturalHeight
                  ctx.drawImage(img, 0, 0)
                  analysis.imageData = canvas.toDataURL('image/jpeg', 0.8)
                }
                
                resolve(analysis)
              } catch (error: any) {
                reject(new Error(`Failed to analyze bike fit: ${error.message}`))
              }
            } else {
              reject(new Error('No pose detected in image. Please ensure you are clearly visible in a side-view position with good lighting.'))
            }
          })

          // Initialize pose detection
          await pose.initialize()
          
          // Send image to pose detection
          await pose.send({ image: img })
          
        } catch (error: any) {
          reject(new Error(`Pose detection failed: ${error.message}`))
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image. Please try a different image format.'))
      }

      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        } else {
          reject(new Error('Failed to process image file'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(imageFile)

    } catch (error: any) {
      reject(new Error(`Image processing failed: ${error.message}`))
    }
  })
}

// Validate pose for bike fitting
export function validatePoseForBikeFit(landmarks: Landmark[]): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!landmarks || landmarks.length < 33) {
    return { isValid: false, issues: ['No pose detected'] }
  }

  // Check if key landmarks are visible
  const keyLandmarks = [
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ]

  for (const landmarkIndex of keyLandmarks) {
    const landmark = landmarks[landmarkIndex]
    if (!landmark || (landmark.visibility !== undefined && landmark.visibility < 0.5)) {
      issues.push('Key body parts not clearly visible. Ensure good lighting and clear view.')
      break
    }
  }

  // Check if person is in profile (side view)
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  
  if (leftShoulder && rightShoulder) {
    const shoulderDistance = calculateDistance(leftShoulder, rightShoulder)
    if (shoulderDistance > 0.15) {
      issues.push('Please position yourself in a side-view (90° to camera) for accurate analysis.')
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

// Utility function to wait for MediaPipe to load
export function waitForMediaPipe(timeout = 10000): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (isMediaPipeLoaded()) {
      resolve(true)
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (isMediaPipeLoaded()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error('MediaPipe libraries failed to load within timeout'))
      }
    }, 100)
  })
} 