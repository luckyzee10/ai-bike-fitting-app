'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Landmark } from '@/types'

interface PoseVisualizationProps {
  imageData: string
  landmarks: Landmark[]
  angles: {
    kneeAngle: number
    torsoAngle: number
    elbowAngle: number
  }
  imageWidth?: number
  imageHeight?: number
  pedalPosition?: '6-oclock' | '3-oclock'  // Add position prop
}

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

const PoseVisualization: React.FC<PoseVisualizationProps> = ({
  imageData,
  landmarks,
  angles,
  imageWidth = 640,
  imageHeight = 480,
  pedalPosition = '6-oclock'  // Default to 6 o'clock
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landmarks || landmarks.length === 0) {
      console.log('PoseVisualization: Missing canvas or landmarks', { 
        canvas: !!canvas, 
        landmarksLength: landmarks?.length 
      })
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('PoseVisualization: Could not get canvas context')
      return
    }

    console.log('PoseVisualization: Starting to draw', {
      landmarksLength: landmarks.length,
      imageWidth,
      imageHeight,
      angles
    })

    // Load and draw the image
    const img = new Image()
    img.onload = () => {
      console.log('Image loaded:', { width: img.width, height: img.height })
      
      // Calculate responsive canvas size while maintaining aspect ratio
      const maxWidth = 600
      const maxHeight = 450
      const aspectRatio = img.width / img.height
      
      let displayWidth = Math.min(maxWidth, img.width)
      let displayHeight = displayWidth / aspectRatio
      
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight
        displayWidth = displayHeight * aspectRatio
      }
      
      setCanvasSize({ width: displayWidth, height: displayHeight })
      canvas.width = displayWidth
      canvas.height = displayHeight
      
      console.log('Canvas dimensions:', { displayWidth, displayHeight })
      
      // Clear canvas and draw image
      ctx.clearRect(0, 0, displayWidth, displayHeight)
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight)
      
      // MediaPipe landmarks are normalized (0-1), so we scale by display dimensions
      const scaleX = displayWidth
      const scaleY = displayHeight
      
      console.log('Scale factors:', { scaleX, scaleY })
      
      // Debug: log a few landmark positions
      const sampleLandmarks = [
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE]
      ]
      console.log('Sample landmarks (normalized):', sampleLandmarks)
      
      // Draw pose landmarks and connections
      drawPoseLandmarks(ctx, landmarks, scaleX, scaleY)
      
      // Draw angle annotations
      drawAngleAnnotations(ctx, landmarks, angles, scaleX, scaleY)
    }
    
    img.onerror = () => {
      console.error('Failed to load image for visualization')
    }
    
    img.src = imageData
  }, [imageData, landmarks, angles, imageWidth, imageHeight])

  const drawPoseLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    scaleX: number,
    scaleY: number
  ) => {
    console.log('Drawing pose landmarks...')
    
    // Draw connections between key points
    const connections = [
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
      [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
    ]
    
    // Draw connections with thick, bright lines
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    
    let connectionsDrawn = 0
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx]
      const end = landmarks[endIdx]
      
      if (start && end) {
        const startX = start.x * scaleX
        const startY = start.y * scaleY
        const endX = end.x * scaleX
        const endY = end.y * scaleY
        
        console.log(`Drawing connection ${startIdx}-${endIdx}:`, {
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          visibility: { start: start.visibility, end: end.visibility }
        })
        
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        connectionsDrawn++
      }
    })
    
    console.log(`Drew ${connectionsDrawn} connections`)
    
    // Draw landmark points
    const keyLandmarks = [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ]
    
    let landmarksDrawn = 0
    keyLandmarks.forEach(idx => {
      const landmark = landmarks[idx]
      if (landmark) {
        const x = landmark.x * scaleX
        const y = landmark.y * scaleY
        
        console.log(`Drawing landmark ${idx}:`, { x, y, visibility: landmark.visibility })
        
        // Draw outer white circle for contrast
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw inner colored circle
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()
        landmarksDrawn++
      }
    })
    
    console.log(`Drew ${landmarksDrawn} landmarks`)
  }

  const drawAngleAnnotations = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    angles: { kneeAngle: number; torsoAngle: number; elbowAngle: number },
    scaleX: number,
    scaleY: number
  ) => {
    console.log('Drawing angle annotations...')
    
    const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const elbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
    const wrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
    const knee = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
    const ankle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]

    // Set up text drawing
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Knee angle annotation
    if (hip && knee && ankle) {
      const kneeX = knee.x * scaleX
      const kneeY = knee.y * scaleY
      
      console.log('Drawing knee angle at:', { kneeX, kneeY, angle: angles.kneeAngle })
      
      // Draw a simple circle first to test
      ctx.strokeStyle = '#10B981'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(kneeX, kneeY, 60, 0, Math.PI / 2)
      ctx.stroke()
      
      // Draw knee angle label
      drawLabelBox(ctx, kneeX - 45, kneeY - 80, `${angles.kneeAngle.toFixed(1)}°`, 'KNEE BEND', '#10B981')
    }

    // Elbow angle annotation
    if (shoulder && elbow && wrist) {
      const elbowX = elbow.x * scaleX
      const elbowY = elbow.y * scaleY
      
      console.log('Drawing elbow angle at:', { elbowX, elbowY, angle: angles.elbowAngle })
      
      // Draw a simple circle first to test
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(elbowX, elbowY, 50, 0, Math.PI / 2)
      ctx.stroke()
      
      // Draw elbow angle label
      drawLabelBox(ctx, elbowX - 45, elbowY + 70, `${angles.elbowAngle.toFixed(1)}°`, 'ELBOW', '#F59E0B')
    }

    // Torso angle annotation
    if (shoulder && hip) {
      const hipX = hip.x * scaleX
      const hipY = hip.y * scaleY
      
      console.log('Drawing torso angle at:', { hipX, hipY, angle: angles.torsoAngle })
      
      // Draw a simple circle first to test
      ctx.strokeStyle = '#8B5CF6'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(hipX, hipY, 70, 0, Math.PI / 2)
      ctx.stroke()
      
      // Draw vertical reference line
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(hipX, hipY)
      ctx.lineTo(hipX, hipY - 80)
      ctx.stroke()
      ctx.setLineDash([]) // Reset dash
      
      // Draw torso angle label
      drawLabelBox(ctx, hipX + 80, hipY - 20, `${angles.torsoAngle.toFixed(1)}°`, 'TORSO', '#8B5CF6')
    }
    
    console.log('Finished drawing angle annotations')
  }

  const drawLabelBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angleText: string,
    labelText: string,
    color: string
  ) => {
    const boxWidth = labelText === 'KNEE BEND' ? 110 : 90 // Wider box for knee bend
    const boxHeight = 35
    
    console.log(`Drawing label box at ${x}, ${y}:`, { angleText, labelText })
    
    // Draw background box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(x, y, boxWidth, boxHeight)
    
    // Draw border
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, boxWidth, boxHeight)
    
    // Draw angle text
    ctx.fillStyle = color
    ctx.font = 'bold 16px Arial'
    ctx.fillText(angleText, x + boxWidth/2, y + 12)
    
    // Draw label text
    ctx.font = 'bold 11px Arial'
    ctx.fillText(labelText, x + boxWidth/2, y + 27)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg shadow-sm bg-white"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Knee Bend: {angles.kneeAngle.toFixed(1)}° from straight (Optimal: {pedalPosition === '3-oclock' ? '70-90°' : '25-35°'} for {pedalPosition === '3-oclock' ? '3 o\'clock' : '6 o\'clock'})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Elbow Angle: {angles.elbowAngle.toFixed(1)}° (Optimal: 150-165°)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Torso Angle: {angles.torsoAngle.toFixed(1)}° from vertical (Optimal: 35-55°)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoseVisualization 