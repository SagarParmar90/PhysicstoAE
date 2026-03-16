export type ShapeType = 'box' | 'ball' | 'text' | 'ground' | 'svg';
export type JointType = 'spring' | 'piston' | 'wheel';

export interface CustomJoint {
  id: string;
  name: string;
  type: JointType;
  bodyAId: string;
  bodyBId: string;
  stiffness?: number;
  length?: number;
}

export interface CustomShape {
  id: string;
  name: string;
  type: ShapeType;
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  rotation?: number;
  color: string;
  textValue?: string;
  fontSize?: number;
  svgData?: string;
  // Physics properties
  isStatic: boolean;
  kinematicType?: 'none' | 'spin' | 'horizontal' | 'vertical';
  density: number;
  friction: number;
  restitution: number;
}

export interface RecordedBody {
  id: number;
  label: string;
  type: ShapeType;
  width?: number;
  height?: number;
  radius?: number;
  initialPos: { x: number; y: number };
  initialAngle: number;
  color: string;
  textValue?: string;
  fontSize?: number;
  svgData?: string;
}

export interface FrameData {
  time: number;
  bodies: Record<number, { x: number; y: number; angle: number }>;
}

export interface RecordingData {
  compWidth: number;
  compHeight: number;
  startTime: number;
  duration: number;
  isRecording: boolean;
  bodies: Record<number, RecordedBody>;
  frames: FrameData[];
}
