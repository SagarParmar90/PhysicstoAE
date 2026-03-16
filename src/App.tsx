/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { PhysicsCanvas } from './components/PhysicsCanvas';
import { CustomShape, CustomJoint, RecordingData } from './types';
import { exportToAE } from './utils/exportToAE';

export default function App() {
  const [simStatus, setSimStatus] = useState<'idle' | 'simulating' | 'finished'>('idle');
  const [progress, setProgress] = useState(0);
  const [gravity, setGravity] = useState(1);
  const [customShapes, setCustomShapes] = useState<CustomShape[]>([]);
  const [customJoints, setCustomJoints] = useState<CustomJoint[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  
  const recordingDataRef = useRef<RecordingData | null>(null);

  const handleAddShape = (shape: Omit<CustomShape, 'id' | 'name' | 'isStatic' | 'density' | 'friction' | 'restitution'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setCustomShapes(prev => [...prev, { 
      ...shape, 
      id: newId,
      name: `${shape.type} ${prev.length + 1}`,
      isStatic: false,
      density: 0.1,
      friction: 0.3,
      restitution: 0.2
    }]);
    setSelectedShapeId(newId);
  };

  const handleAddShapes = (shapes: Omit<CustomShape, 'id' | 'name' | 'isStatic' | 'density' | 'friction' | 'restitution'>[]) => {
    setCustomShapes(prev => [
      ...prev,
      ...shapes.map((shape, i) => ({ 
        ...shape, 
        id: Math.random().toString(36).substr(2, 9),
        name: `${shape.type} ${prev.length + i + 1}`,
        isStatic: false,
        density: 0.1,
        friction: 0.3,
        restitution: 0.2
      }))
    ]);
  };

  const handleAddLiquid = () => {
    const newShapes: CustomShape[] = [];
    const startX = 400;
    const startY = 50;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 10; j++) {
        newShapes.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `Drop ${i}-${j}`,
          type: 'ball',
          x: startX + j * 12,
          y: startY + i * 12,
          r: 5,
          color: '#3b82f6',
          isStatic: false,
          density: 0.05,
          friction: 0.001,
          restitution: 0.6
        });
      }
    }
    setCustomShapes(prev => [...prev, ...newShapes]);
  };

  const handleAddChain = () => {
    const newShapes: CustomShape[] = [];
    const newJoints: CustomJoint[] = [];
    const startX = 600;
    const startY = 50;
    const links = 8;
    let prevId: string | null = null;

    for (let i = 0; i < links; i++) {
      const id = Math.random().toString(36).substr(2, 9);
      newShapes.push({
        id,
        name: `Link ${i + 1}`,
        type: 'box',
        x: startX,
        y: startY + i * 35,
        w: 12,
        h: 30,
        color: '#94a3b8',
        isStatic: i === 0,
        density: 0.1,
        friction: 0.5,
        restitution: 0.2
      });

      if (prevId) {
        newJoints.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `Chain Link ${i}`,
          type: 'wheel',
          bodyAId: prevId,
          bodyBId: id,
          stiffness: 0.9,
          length: 25
        });
      }
      prevId = id;
    }
    
    setCustomShapes(prev => [...prev, ...newShapes]);
    setCustomJoints(prev => [...prev, ...newJoints]);
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    setCustomShapes(prev => {
      if (prev.length === 0) return prev;
      
      const minX = Math.min(...prev.map(s => s.x));
      const maxX = Math.max(...prev.map(s => s.x));
      const minY = Math.min(...prev.map(s => s.y));
      const maxY = Math.max(...prev.map(s => s.y));
      
      return prev.map(shape => {
        let { x, y } = shape;
        switch (type) {
          case 'left': x = minX; break;
          case 'center': x = (minX + maxX) / 2; break;
          case 'right': x = maxX; break;
          case 'top': y = minY; break;
          case 'middle': y = (minY + maxY) / 2; break;
          case 'bottom': y = maxY; break;
        }
        return { ...shape, x, y };
      });
    });
  };

  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    setCustomShapes(prev => {
      if (prev.length < 2) return prev;
      
      const sorted = [...prev].sort((a, b) => type === 'horizontal' ? a.x - b.x : a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      const totalDistance = type === 'horizontal' ? last.x - first.x : last.y - first.y;
      const step = totalDistance === 0 ? 50 : totalDistance / (sorted.length - 1);
      
      return prev.map(shape => {
        const index = sorted.findIndex(s => s.id === shape.id);
        let { x, y } = shape;
        if (type === 'horizontal') {
          x = first.x + index * step;
        } else {
          y = first.y + index * step;
        }
        return { ...shape, x, y };
      });
    });
  };

  const handleShapeMove = (id: string, x: number, y: number) => {
    setCustomShapes(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  };

  const handleShapeUpdate = (id: string, updates: Partial<CustomShape>) => {
    setCustomShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteShape = (id: string) => {
    setCustomShapes(prev => prev.filter(s => s.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  };

  const handleClearShapes = () => {
    setCustomShapes([]);
    setCustomJoints([]);
    setSelectedShapeId(null);
  };

  const handleAddJoint = (joint: Omit<CustomJoint, 'id' | 'name'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setCustomJoints(prev => [...prev, {
      ...joint,
      id: newId,
      name: `${joint.type} ${prev.length + 1}`
    }]);
  };

  const handleDeleteJoint = (id: string) => {
    setCustomJoints(prev => prev.filter(j => j.id !== id));
  };

  const handleResetCanvas = () => {
    setSimStatus('idle');
    setProgress(0);
    setResetTrigger(prev => prev + 1);
    recordingDataRef.current = null;
  };

  const handleSimulate = () => {
    setSimStatus('simulating');
    setProgress(0);
  };

  const handleExport = () => {
    if (recordingDataRef.current) {
      exportToAE(recordingDataRef.current);
    }
  };

  const handleRecordingComplete = (data: RecordingData) => {
    recordingDataRef.current = data;
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Sidebar 
        simStatus={simStatus}
        progress={progress}
        gravity={gravity}
        setGravity={setGravity}
        customShapes={customShapes}
        customJoints={customJoints}
        selectedShapeId={selectedShapeId}
        onSelectShape={setSelectedShapeId}
        onUpdateShape={handleShapeUpdate}
        onDeleteShape={handleDeleteShape}
        onAddShape={handleAddShape}
        onAddShapes={handleAddShapes}
        onAddLiquid={handleAddLiquid}
        onAddChain={handleAddChain}
        onAddJoint={handleAddJoint}
        onDeleteJoint={handleDeleteJoint}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onClearShapes={handleClearShapes}
        onResetCanvas={handleResetCanvas}
        onSimulate={handleSimulate}
        onExport={handleExport}
      />
      <PhysicsCanvas 
        simStatus={simStatus}
        setSimStatus={setSimStatus}
        setProgress={setProgress}
        gravity={gravity}
        customShapes={customShapes}
        customJoints={customJoints}
        selectedShapeId={selectedShapeId}
        onSelectShape={setSelectedShapeId}
        onRecordingComplete={handleRecordingComplete}
        onShapeMove={handleShapeMove}
        resetTrigger={resetTrigger}
      />
    </div>
  );
}
