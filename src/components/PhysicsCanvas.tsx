import React, { useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import { CustomShape, CustomJoint, RecordingData, RecordedBody } from '../types';

interface PhysicsCanvasProps {
  simStatus: 'idle' | 'simulating' | 'finished';
  setSimStatus: (status: 'idle' | 'simulating' | 'finished') => void;
  setProgress: (progress: number) => void;
  gravity: number;
  customShapes: CustomShape[];
  customJoints: CustomJoint[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onRecordingComplete: (data: RecordingData) => void;
  onShapeMove?: (id: string, x: number, y: number) => void;
  resetTrigger: number;
}

export function PhysicsCanvas(props: PhysicsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const simStatusRef = useRef(props.simStatus);

  useEffect(() => {
    simStatusRef.current = props.simStatus;
  }, [props.simStatus]);
  
  const recordingDataRef = useRef<RecordingData & { engineStartTime: number }>({
    compWidth: 1000,
    compHeight: 600,
    startTime: 0,
    engineStartTime: 0,
    duration: 5000, // 5 seconds max
    isRecording: false,
    bodies: {},
    frames: []
  });

  const SIMULATION_DURATION = 5000;
  const CANVAS_HEIGHT = 600;

  // Initialize and update world
  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate dynamic width
    const canvasWidth = 1200; // Fixed width for now, could be dynamic based on container
    
    recordingDataRef.current.compWidth = canvasWidth;

    // Cleanup previous instance
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      renderRef.current.canvas.remove();
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
    }
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
    }

    // Setup Engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: props.gravity, scale: 0.001 }
    });
    engineRef.current = engine;

    // Setup Render
    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width: canvasWidth,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: '#18181b', // zinc-900
        hasBounds: true,
      }
    });
    renderRef.current = render;

    // Setup Ground
    const groundHeight = 60;
    const ground = Matter.Bodies.rectangle(
      canvasWidth / 2, 
      CANVAS_HEIGHT - groundHeight / 2, 
      canvasWidth * 2, 
      groundHeight, 
      { 
        isStatic: true,
        render: { fillStyle: '#27272a' }, // zinc-800
        label: 'ground'
      }
    );

    // Setup Custom Shapes
    const customBodies = props.customShapes.map((shape, i) => {
      let body: Matter.Body | null = null;
      
      const commonOptions = {
        isStatic: props.simStatus === 'idle' ? true : shape.isStatic,
        density: shape.density,
        friction: shape.friction,
        restitution: shape.restitution,
        angle: (shape.rotation || 0) * (Math.PI / 180),
      };

      if (shape.type === 'box') {
        body = Matter.Bodies.rectangle(shape.x, shape.y, shape.w || 60, shape.h || 60, {
          ...commonOptions,
          render: { 
            fillStyle: shape.color,
            strokeStyle: props.selectedShapeId === shape.id ? '#6366f1' : 'transparent',
            lineWidth: props.selectedShapeId === shape.id ? 3 : 0
          },
          label: `box_${i}`
        });
      } else if (shape.type === 'ball') {
        body = Matter.Bodies.circle(shape.x, shape.y, shape.r || 30, {
          ...commonOptions,
          render: { 
            fillStyle: shape.color,
            strokeStyle: props.selectedShapeId === shape.id ? '#6366f1' : 'transparent',
            lineWidth: props.selectedShapeId === shape.id ? 3 : 0
          },
          label: `ball_${i}`
        });
      } else if (shape.type === 'text') {
        // Estimate text width using a temporary canvas
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        let textWidth = 100;
        if (ctx) {
          ctx.font = `${shape.fontSize || 48}px Arial`;
          textWidth = ctx.measureText(shape.textValue || '').width;
        }
        
        body = Matter.Bodies.rectangle(shape.x, shape.y, textWidth, shape.fontSize || 48, {
          ...commonOptions,
          render: { 
            fillStyle: 'transparent', // Transparent physical box
            strokeStyle: props.selectedShapeId === shape.id ? '#6366f1' : '#52525b', // zinc-600
            lineWidth: props.selectedShapeId === shape.id ? 3 : 1
          },
          label: `text_${i}`,
          plugin: {
            textValue: shape.textValue,
            fontSize: shape.fontSize,
            color: shape.color
          }
        });
      } else if (shape.type === 'svg' && shape.svgData) {
        const img = new Image();
        img.src = shape.svgData;
        
        body = Matter.Bodies.rectangle(shape.x, shape.y, shape.w || 60, shape.h || 60, {
          ...commonOptions,
          render: { 
            fillStyle: 'transparent', // Transparent physical box
            strokeStyle: props.selectedShapeId === shape.id ? '#6366f1' : '#52525b', // zinc-600
            lineWidth: props.selectedShapeId === shape.id ? 3 : 1
          },
          label: `svg_${i}`,
          plugin: {
            svgData: shape.svgData,
            w: shape.w || 60,
            h: shape.h || 60,
            image: img
          }
        });
      }
      
      if (body) {
        body.plugin = { 
          ...body.plugin, 
          customShapeId: shape.id,
          kinematicType: shape.kinematicType,
          initialX: shape.x,
          initialY: shape.y
        };
      }
      
      return body;
    }).filter(Boolean) as Matter.Body[];

    Matter.World.add(engine.world, [ground, ...customBodies]);

    // Setup Custom Joints
    const customConstraints = props.customJoints.map(joint => {
      const bodyA = customBodies.find(b => b.plugin?.customShapeId === joint.bodyAId);
      const bodyB = customBodies.find(b => b.plugin?.customShapeId === joint.bodyBId);
      
      if (!bodyA || !bodyB) return null;

      let options: Matter.IConstraintDefinition = {
        bodyA,
        bodyB,
        stiffness: joint.stiffness || 0.1,
        length: joint.length || 100,
        render: {
          visible: true,
          lineWidth: 2,
          strokeStyle: '#6366f1'
        }
      };

      if (joint.type === 'spring') {
        // Default options are fine for spring
      } else if (joint.type === 'piston') {
        // A piston is basically a constraint with length 0 and high stiffness, 
        // but usually it constrains movement to an axis. 
        // For simplicity, we'll just make it a very stiff spring.
        options.stiffness = 1;
      } else if (joint.type === 'wheel') {
        // A wheel joint (revolute)
        options.length = 0;
        options.stiffness = 1;
      }

      return Matter.Constraint.create(options);
    }).filter(Boolean) as Matter.Constraint[];

    Matter.World.add(engine.world, customConstraints);

    // Add Mouse Constraint for dragging
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    let draggedBody: Matter.Body | null = null;
    let dragOffset = { x: 0, y: 0 };

    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position;
      const bodies = Matter.Composite.allBodies(engine.world);
      const clickedBodies = Matter.Query.point(bodies, mousePosition);
      
      if (clickedBodies.length > 0) {
        const body = clickedBodies.find(b => b.plugin && b.plugin.customShapeId);
        if (body) {
          props.onSelectShape(body.plugin.customShapeId);
          if (simStatusRef.current === 'idle') {
            draggedBody = body;
            dragOffset = {
              x: body.position.x - mousePosition.x,
              y: body.position.y - mousePosition.y
            };
          }
        } else {
          props.onSelectShape(null);
        }
      } else {
        props.onSelectShape(null);
      }
    });

    Matter.Events.on(mouseConstraint, 'mousemove', (event) => {
      if (draggedBody && simStatusRef.current === 'idle') {
        const mousePosition = event.mouse.position;
        Matter.Body.setPosition(draggedBody, {
          x: mousePosition.x + dragOffset.x,
          y: mousePosition.y + dragOffset.y
        });
      }
    });

    Matter.Events.on(mouseConstraint, 'mouseup', (event) => {
      if (draggedBody && simStatusRef.current === 'idle') {
        if (props.onShapeMove) {
          props.onShapeMove(draggedBody.plugin.customShapeId, draggedBody.position.x, draggedBody.position.y);
        }
        draggedBody = null;
      }
    });

    // Kinematic Animations
    Matter.Events.on(engine, 'beforeUpdate', (e) => {
      const time = e.timestamp;
      const bodies = Matter.Composite.allBodies(engine.world);
      bodies.forEach(body => {
        if (body.isStatic && body.plugin && body.plugin.kinematicType && body.plugin.kinematicType !== 'none') {
          const type = body.plugin.kinematicType;
          if (type === 'spin') {
            Matter.Body.setAngle(body, body.angle + 0.05);
          } else if (type === 'horizontal') {
            const startX = body.plugin.initialX;
            Matter.Body.setPosition(body, { x: startX + Math.sin(time * 0.002) * 150, y: body.position.y });
          } else if (type === 'vertical') {
            const startY = body.plugin.initialY;
            Matter.Body.setPosition(body, { x: body.position.x, y: startY + Math.sin(time * 0.002) * 150 });
          }
        }
      });
    });

    // Custom Text Rendering
    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const bodies = Matter.Composite.allBodies(engine.world);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      bodies.forEach(body => {
        if (body.label.startsWith('text_') && body.plugin && body.plugin.textValue) {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          ctx.fillStyle = body.plugin.color;
          ctx.font = `${body.plugin.fontSize}px Arial`;
          ctx.fillText(body.plugin.textValue, 0, 0);
          ctx.restore();
        } else if (body.label.startsWith('svg_') && body.plugin && body.plugin.image) {
          const img = body.plugin.image;
          if (img.complete && img.naturalWidth) {
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            ctx.drawImage(img, -body.plugin.w / 2, -body.plugin.h / 2, body.plugin.w, body.plugin.h);
            ctx.restore();
          }
        }
      });
    });

    // Recording Logic
    Matter.Events.on(engine, 'afterUpdate', () => {
      if (!recordingDataRef.current.isRecording) return;

      const elapsed = engine.timing.timestamp - recordingDataRef.current.engineStartTime;
      
      if (elapsed >= SIMULATION_DURATION) {
        stopSimulation();
        return;
      }

      props.setProgress((elapsed / SIMULATION_DURATION) * 100);

      const frameBodies: Record<number, { x: number; y: number; angle: number }> = {};
      const allBodies = Matter.Composite.allBodies(engine.world);
      
      allBodies.forEach(body => {
        if (!body.isStatic) {
          frameBodies[body.id] = {
            x: body.position.x,
            y: body.position.y,
            angle: body.angle
          };
        }
      });

      recordingDataRef.current.frames.push({
        time: elapsed,
        bodies: frameBodies
      });
    });

    Matter.Render.run(render);
    
    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    
    // Start runner immediately so objects settle and can be dragged
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      render.canvas.remove();
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [props.customShapes, props.customJoints, props.resetTrigger, props.simStatus]);

  useEffect(() => {
    if (!engineRef.current) return;
    
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      if (body.plugin && body.plugin.customShapeId) {
        const isSelected = body.plugin.customShapeId === props.selectedShapeId;
        if (body.render) {
          if (body.label.startsWith('text_') || body.label.startsWith('svg_')) {
            body.render.strokeStyle = isSelected ? '#6366f1' : '#52525b';
            body.render.lineWidth = isSelected ? 3 : 1;
          } else {
            body.render.strokeStyle = isSelected ? '#6366f1' : 'transparent';
            body.render.lineWidth = isSelected ? 3 : 0;
          }
        }
      }
    });
  }, [props.selectedShapeId]);

  // Handle Gravity changes dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = props.gravity;
    }
  }, [props.gravity]);

  // Handle Simulation Start
  useEffect(() => {
    if (props.simStatus === 'simulating' && engineRef.current) {
      startSimulation();
    }
  }, [props.simStatus]);

  const startSimulation = () => {
    if (!engineRef.current || !mouseConstraintRef.current) return;

    const allBodies = Matter.Composite.allBodies(engineRef.current.world);
    
    // Wake up all bodies
    allBodies.forEach(body => {
      Matter.Sleeping.set(body, false);
    });

    // Initialize recording data
    const recordedBodies: Record<number, RecordedBody> = {};

    allBodies.forEach(body => {
      let type: 'box' | 'ball' | 'text' | 'ground' | 'svg' = 'box';
      if (body.label === 'ground') type = 'ground';
      else if (body.label.startsWith('ball_')) type = 'ball';
      else if (body.label.startsWith('text_')) type = 'text';
      else if (body.label.startsWith('svg_')) type = 'svg';

      let width, height, radius;
      if (type === 'ball') {
        radius = body.circleRadius;
      } else if (type === 'svg') {
        width = body.plugin?.w;
        height = body.plugin?.h;
      } else {
        // Approximate width/height from bounds
        width = body.bounds.max.x - body.bounds.min.x;
        height = body.bounds.max.y - body.bounds.min.y;
      }

      recordedBodies[body.id] = {
        id: body.id,
        label: body.label,
        type,
        width,
        height,
        radius,
        initialPos: { x: body.position.x, y: body.position.y },
        initialAngle: body.angle,
        color: body.render.fillStyle || '#ffffff',
        textValue: body.plugin?.textValue,
        fontSize: body.plugin?.fontSize,
        svgData: body.plugin?.svgData
      };
    });

    recordingDataRef.current = {
      ...recordingDataRef.current,
      startTime: Date.now(),
      engineStartTime: engineRef.current.timing.timestamp,
      isRecording: true,
      bodies: recordedBodies,
      frames: []
    };
  };

  const stopSimulation = () => {
    recordingDataRef.current.isRecording = false;
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
    }
    props.setSimStatus('finished');
    props.setProgress(100);
    props.onRecordingComplete(recordingDataRef.current);
  };

  return (
    <div className="flex-1 bg-zinc-950 overflow-auto relative flex items-center justify-center p-8">
      <div 
        ref={containerRef}
        className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10"
      />
    </div>
  );
}
