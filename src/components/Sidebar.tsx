import React, { useState, useRef } from 'react';
import { CustomShape, CustomJoint, JointType } from '../types';
import { Play, Download, Trash2, RotateCcw, Upload, AlignLeft, AlignCenter, AlignRight, MoreHorizontal, MoreVertical, Layers, Settings2, Link, Droplets, Link2 } from 'lucide-react';

interface SidebarProps {
  simStatus: 'idle' | 'simulating' | 'finished';
  progress: number;
  gravity: number;
  setGravity: (val: number) => void;
  customShapes: CustomShape[];
  customJoints: CustomJoint[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, updates: Partial<CustomShape>) => void;
  onDeleteShape: (id: string) => void;
  onAddShape: (shape: Omit<CustomShape, 'id' | 'name' | 'isStatic' | 'density' | 'friction' | 'restitution'>) => void;
  onAddShapes: (shapes: Omit<CustomShape, 'id' | 'name' | 'isStatic' | 'density' | 'friction' | 'restitution'>[]) => void;
  onAddLiquid: () => void;
  onAddChain: () => void;
  onAddJoint: (joint: Omit<CustomJoint, 'id' | 'name'>) => void;
  onDeleteJoint: (id: string) => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (type: 'horizontal' | 'vertical') => void;
  onClearShapes: () => void;
  onResetCanvas: () => void;
  onSimulate: () => void;
  onExport: () => void;
}

export function Sidebar(props: SidebarProps) {
  const [shapeScale, setShapeScale] = useState(1);
  const [shapeCount, setShapeCount] = useState(1);
  const [shapeGap, setShapeGap] = useState(20);
  const [activeTab, setActiveTab] = useState<'add' | 'layers' | 'properties' | 'joints'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jointType, setJointType] = useState<JointType>('spring');
  const [jointBodyA, setJointBodyA] = useState<string>('');
  const [jointBodyB, setJointBodyB] = useState<string>('');
  const [jointStiffness, setJointStiffness] = useState<number>(0.1);
  const [jointLength, setJointLength] = useState<number>(100);

  const selectedShape = props.customShapes.find(s => s.id === props.selectedShapeId);

  React.useEffect(() => {
    if (props.selectedShapeId) {
      setActiveTab('properties');
    }
  }, [props.selectedShapeId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      // Load image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const baseWidth = img.naturalWidth || 100;
        const baseHeight = img.naturalHeight || 100;
        
        // Normalize base size so it's manageable
        const maxBase = 150;
        let w = baseWidth;
        let h = baseHeight;
        if (w > maxBase || h > maxBase) {
          const ratio = Math.min(maxBase / w, maxBase / h);
          w *= ratio;
          h *= ratio;
        }

        const shapesToAdd: Omit<CustomShape, 'id' | 'name' | 'isStatic' | 'density' | 'friction' | 'restitution'>[] = [];
        for (let i = 0; i < shapeCount; i++) {
          shapesToAdd.push({
            type: 'svg',
            x: 400 + i * (w * shapeScale + shapeGap),
            y: 200,
            w: w * shapeScale,
            h: h * shapeScale,
            color: '#ffffff',
            svgData: result
          });
        }
        props.onAddShapes(shapesToAdd);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-80 bg-zinc-900 text-zinc-100 h-screen p-6 flex flex-col gap-6 overflow-y-auto border-r border-zinc-800 shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1">PhysicsToAE</h1>
          <p className="text-xs text-zinc-400">2D Physics Sandbox</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${props.simStatus === 'idle' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {props.simStatus === 'idle' ? 'Editor Mode' : 'Simulating'}
        </div>
      </div>

      <div className="flex border-b border-zinc-800 mb-4">
        <button 
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'add' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Add
        </button>
        <button 
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'layers' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center justify-center gap-1">
            <Layers size={14} /> Layers
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'properties' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center justify-center gap-1">
            <Settings2 size={14} /> Props
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('joints')}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'joints' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center justify-center gap-1">
            <Link size={14} /> Joints
          </div>
        </button>
      </div>

      {activeTab === 'add' && (
        <>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Physics</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Gravity (Y)</label>
                <span>{props.gravity.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="3" step="0.1" 
                value={props.gravity} 
                onChange={(e) => props.setGravity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
                disabled={props.simStatus !== 'idle'}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Custom Shape</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-zinc-400">Upload Scale</label>
                <span>{shapeScale.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="5" step="0.1" 
                value={shapeScale} 
                onChange={(e) => setShapeScale(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
                disabled={props.simStatus !== 'idle'}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Count</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={shapeCount}
                  onChange={(e) => setShapeCount(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  disabled={props.simStatus !== 'idle'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Gap</label>
                <input 
                  type="number" 
                  value={shapeGap}
                  onChange={(e) => setShapeGap(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  disabled={props.simStatus !== 'idle'}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={props.simStatus !== 'idle'}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 py-3 rounded text-sm transition-colors border border-zinc-700 border-dashed"
              >
                <Upload size={16} /> Upload SVG Shape
              </button>
              <input 
                type="file" 
                accept=".svg" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={props.onClearShapes}
                disabled={props.simStatus !== 'idle'}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-900/30 text-red-400 disabled:opacity-50 py-2 rounded text-sm transition-colors"
              >
                <Trash2 size={14} /> Clear Shapes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={props.onAddLiquid} 
                disabled={props.simStatus !== 'idle'}
                className="flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 py-2 rounded text-xs font-medium transition-colors"
              >
                <Droplets size={14} /> Add Liquid
              </button>
              <button 
                onClick={props.onAddChain} 
                disabled={props.simStatus !== 'idle'}
                className="flex items-center justify-center gap-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 py-2 rounded text-xs font-medium transition-colors"
              >
                <Link2 size={14} /> Add Chain
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Align & Distribute</h2>
            
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Align Layers</label>
              <div className="flex gap-1 bg-zinc-800 p-1 rounded">
                <button onClick={() => props.onAlign('left')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Left"><AlignLeft size={16} /></button>
                <button onClick={() => props.onAlign('center')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Center"><AlignCenter size={16} /></button>
                <button onClick={() => props.onAlign('right')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Right"><AlignRight size={16} /></button>
                <div className="w-px bg-zinc-700 mx-1 my-1"></div>
                <button onClick={() => props.onAlign('top')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Top"><AlignLeft size={16} className="rotate-90" /></button>
                <button onClick={() => props.onAlign('middle')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Middle"><AlignCenter size={16} className="rotate-90" /></button>
                <button onClick={() => props.onAlign('bottom')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Align Bottom"><AlignRight size={16} className="rotate-90" /></button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Distribute Layers</label>
              <div className="flex gap-1 bg-zinc-800 p-1 rounded">
                <button onClick={() => props.onDistribute('horizontal')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Distribute Horizontally"><MoreHorizontal size={16} /></button>
                <button onClick={() => props.onDistribute('vertical')} disabled={props.simStatus !== 'idle'} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors" title="Distribute Vertically"><MoreVertical size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'layers' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {props.customShapes.length === 0 ? (
            <div className="text-xs text-zinc-500 text-center py-8">No layers yet</div>
          ) : (
            props.customShapes.map(shape => (
              <div 
                key={shape.id}
                onClick={() => props.onSelectShape(shape.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${props.selectedShapeId === shape.id ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                <span className="truncate">{shape.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDeleteShape(shape.id);
                  }}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-6">
          {!selectedShape ? (
            <div className="text-xs text-zinc-500 text-center py-8">Select a layer to edit properties</div>
          ) : (
            <>
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Transform</h2>
                
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Name</label>
                  <input 
                    type="text" 
                    value={selectedShape.name}
                    onChange={(e) => props.onUpdateShape(selectedShape.id, { name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                    disabled={props.simStatus !== 'idle'}
                  />
                </div>

                <div className="space-y-4">
                  {(selectedShape.type === 'box' || selectedShape.type === 'svg') && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-xs text-zinc-400">Length (Width)</label>
                          <span className="text-xs text-zinc-500">{selectedShape.w || 0}px</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="range" 
                            min="10" max="500" 
                            value={selectedShape.w || 0}
                            onChange={(e) => props.onUpdateShape(selectedShape.id, { w: Number(e.target.value) })}
                            className="flex-1 accent-indigo-500"
                            disabled={props.simStatus !== 'idle'}
                          />
                          <input 
                            type="number" 
                            value={selectedShape.w || 0}
                            onChange={(e) => props.onUpdateShape(selectedShape.id, { w: Number(e.target.value) })}
                            className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                            disabled={props.simStatus !== 'idle'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-xs text-zinc-400">Thickness (Height)</label>
                          <span className="text-xs text-zinc-500">{selectedShape.h || 0}px</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="range" 
                            min="10" max="500" 
                            value={selectedShape.h || 0}
                            onChange={(e) => props.onUpdateShape(selectedShape.id, { h: Number(e.target.value) })}
                            className="flex-1 accent-indigo-500"
                            disabled={props.simStatus !== 'idle'}
                          />
                          <input 
                            type="number" 
                            value={selectedShape.h || 0}
                            onChange={(e) => props.onUpdateShape(selectedShape.id, { h: Number(e.target.value) })}
                            className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                            disabled={props.simStatus !== 'idle'}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {selectedShape.type === 'ball' && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-xs text-zinc-400">Radius</label>
                        <span className="text-xs text-zinc-500">{selectedShape.r || 0}px</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="range" 
                          min="5" max="250" 
                          value={selectedShape.r || 0}
                          onChange={(e) => props.onUpdateShape(selectedShape.id, { r: Number(e.target.value) })}
                          className="flex-1 accent-indigo-500"
                          disabled={props.simStatus !== 'idle'}
                        />
                        <input 
                          type="number" 
                          value={selectedShape.r || 0}
                          onChange={(e) => props.onUpdateShape(selectedShape.id, { r: Number(e.target.value) })}
                          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                          disabled={props.simStatus !== 'idle'}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-400">Rotation (°)</label>
                      <span className="text-xs text-zinc-500">{selectedShape.rotation || 0}°</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="range" 
                        min="0" max="360" 
                        value={selectedShape.rotation || 0}
                        onChange={(e) => props.onUpdateShape(selectedShape.id, { rotation: Number(e.target.value) })}
                        className="flex-1 accent-indigo-500"
                        disabled={props.simStatus !== 'idle'}
                      />
                      <input 
                        type="number" 
                        value={selectedShape.rotation || 0}
                        onChange={(e) => props.onUpdateShape(selectedShape.id, { rotation: Number(e.target.value) })}
                        className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                        disabled={props.simStatus !== 'idle'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Physics</h2>
                
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Type</label>
                  <select 
                    value={selectedShape.isStatic ? 'static' : 'dynamic'}
                    onChange={(e) => props.onUpdateShape(selectedShape.id, { isStatic: e.target.value === 'static' })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                    disabled={props.simStatus !== 'idle'}
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                  </select>
                </div>

                {selectedShape.isStatic && (
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Kinematic Animation</label>
                    <select 
                      value={selectedShape.kinematicType || 'none'}
                      onChange={(e) => props.onUpdateShape(selectedShape.id, { kinematicType: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                      disabled={props.simStatus !== 'idle'}
                    >
                      <option value="none">None</option>
                      <option value="spin">Spin</option>
                      <option value="horizontal">Move Horizontal</option>
                      <option value="vertical">Move Vertical</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Density</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={selectedShape.density}
                      onChange={(e) => props.onUpdateShape(selectedShape.id, { density: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                      disabled={props.simStatus !== 'idle'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Friction</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={selectedShape.friction}
                      onChange={(e) => props.onUpdateShape(selectedShape.id, { friction: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                      disabled={props.simStatus !== 'idle'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Bounce</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={selectedShape.restitution}
                      onChange={(e) => props.onUpdateShape(selectedShape.id, { restitution: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                      disabled={props.simStatus !== 'idle'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'joints' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Add Joint</h2>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Type</label>
              <select 
                value={jointType}
                onChange={(e) => setJointType(e.target.value as JointType)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                disabled={props.simStatus !== 'idle'}
              >
                <option value="spring">Spring</option>
                <option value="piston">Piston</option>
                <option value="wheel">Wheel</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Body A</label>
              <select 
                value={jointBodyA}
                onChange={(e) => setJointBodyA(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                disabled={props.simStatus !== 'idle'}
              >
                <option value="">Select Body A</option>
                {props.customShapes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Body B</label>
              <select 
                value={jointBodyB}
                onChange={(e) => setJointBodyB(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                disabled={props.simStatus !== 'idle'}
              >
                <option value="">Select Body B</option>
                {props.customShapes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Stiffness</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="1"
                  value={jointStiffness}
                  onChange={(e) => setJointStiffness(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  disabled={props.simStatus !== 'idle'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Length</label>
                <input 
                  type="number" 
                  value={jointLength}
                  onChange={(e) => setJointLength(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  disabled={props.simStatus !== 'idle'}
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (jointBodyA && jointBodyB && jointBodyA !== jointBodyB) {
                  props.onAddJoint({
                    type: jointType,
                    bodyAId: jointBodyA,
                    bodyBId: jointBodyB,
                    stiffness: jointStiffness,
                    length: jointLength
                  });
                }
              }}
              disabled={!jointBodyA || !jointBodyB || jointBodyA === jointBodyB || props.simStatus !== 'idle'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded py-2 text-sm font-medium transition-colors"
            >
              Add Joint
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Joints List</h2>
            {props.customJoints.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-4">No joints added</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {props.customJoints.map(joint => (
                  <div 
                    key={joint.id}
                    className="flex items-center justify-between p-2 rounded bg-zinc-800/50 border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <Link size={16} className="text-zinc-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-200">{joint.name}</span>
                        <span className="text-xs text-zinc-500">
                          {props.customShapes.find(s => s.id === joint.bodyAId)?.name} ↔ {props.customShapes.find(s => s.id === joint.bodyBId)?.name}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => props.onDeleteJoint(joint.id)}
                      className="text-zinc-400 hover:text-red-400"
                      disabled={props.simStatus !== 'idle'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-4">
        {props.simStatus !== 'idle' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Simulation Progress</span>
              <span>{Math.round(props.progress)}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-100"
                style={{ width: `${props.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={props.onResetCanvas}
            disabled={props.simStatus === 'simulating'}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 py-2.5 rounded text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
          
          {props.simStatus === 'idle' ? (
            <button 
              onClick={props.onSimulate}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded text-sm font-medium transition-colors"
            >
              <Play size={16} /> Simulate
            </button>
          ) : (
            <button 
              onClick={props.onExport}
              disabled={props.simStatus === 'simulating'}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 py-2.5 rounded text-sm font-medium transition-colors"
            >
              <Download size={16} /> Export JSX
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
