import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface Court3DProps {
  courtType: string;
  surfaceColor: string;
  lineColor: string;
  kitchenColor?: string;
  outOfBoundsColor: string;
  lineWidth: number;
}

const Court3D = ({ courtType, surfaceColor, lineColor, kitchenColor, outOfBoundsColor, lineWidth }: Court3DProps) => {
  const renderCourt = () => {
    const lineHeight = 0.02;
    const surfaceHeight = 0.01;
    
    if (courtType === "pickleball") {
      const courtW = 20;
      const courtL = 44;
      const oobPadding = 10;
      const nvzDepth = 7;
      
      return (
        <group>
          {/* Out of bounds */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[courtW + oobPadding * 2, surfaceHeight, courtL + oobPadding * 2]} />
            <meshStandardMaterial color={outOfBoundsColor} />
          </mesh>
          
          {/* Court surface */}
          <mesh position={[0, surfaceHeight, 0]}>
            <boxGeometry args={[courtW, surfaceHeight, courtL]} />
            <meshStandardMaterial color={surfaceColor} />
          </mesh>
          
          {/* Kitchen (NVZ) */}
          <mesh position={[0, surfaceHeight + 0.001, 0]}>
            <boxGeometry args={[courtW, surfaceHeight / 2, nvzDepth * 2]} />
            <meshStandardMaterial color={kitchenColor || surfaceColor} transparent opacity={0.3} />
          </mesh>
          
          {/* Lines */}
          {/* Perimeter */}
          <mesh position={[-courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, -courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          
          {/* Center line */}
          <mesh position={[0, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          
          {/* NVZ lines */}
          <mesh position={[0, surfaceHeight + lineHeight / 2, -nvzDepth]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, nvzDepth]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
        </group>
      );
    }
    
    if (courtType === "basketball-full") {
      const courtW = 50;
      const courtL = 94;
      const oobPadding = 10;
      
      return (
        <group>
          {/* Out of bounds */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[courtW + oobPadding * 2, surfaceHeight, courtL + oobPadding * 2]} />
            <meshStandardMaterial color={outOfBoundsColor} />
          </mesh>
          
          {/* Court surface */}
          <mesh position={[0, surfaceHeight, 0]}>
            <boxGeometry args={[courtW, surfaceHeight, courtL]} />
            <meshStandardMaterial color={surfaceColor} />
          </mesh>
          
          {/* Lines */}
          <mesh position={[-courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, -courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
        </group>
      );
    }
    
    if (courtType === "basketball-half") {
      const courtW = 50;
      const courtL = 47;
      const oobPadding = 10;
      
      return (
        <group>
          {/* Out of bounds */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[courtW + oobPadding * 2, surfaceHeight, courtL + oobPadding * 2]} />
            <meshStandardMaterial color={outOfBoundsColor} />
          </mesh>
          
          {/* Court surface */}
          <mesh position={[0, surfaceHeight, 0]}>
            <boxGeometry args={[courtW, surfaceHeight, courtL]} />
            <meshStandardMaterial color={surfaceColor} />
          </mesh>
          
          {/* Lines */}
          <mesh position={[-courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
            <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, -courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
          <mesh position={[0, surfaceHeight + lineHeight / 2, courtL / 2]}>
            <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
            <meshStandardMaterial color={lineColor} />
          </mesh>
        </group>
      );
    }
    
    // Tennis courts
    const isSingles = courtType === "tennis-singles";
    const courtW = isSingles ? 27 : 36;
    const courtL = 78;
    const oobPadding = 12;
    
    return (
      <group>
        {/* Out of bounds */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[courtW + oobPadding * 2, surfaceHeight, courtL + oobPadding * 2]} />
          <meshStandardMaterial color={outOfBoundsColor} />
        </mesh>
        
        {/* Court surface */}
        <mesh position={[0, surfaceHeight, 0]}>
          <boxGeometry args={[courtW, surfaceHeight, courtL]} />
          <meshStandardMaterial color={surfaceColor} />
        </mesh>
        
        {/* Lines */}
        <mesh position={[-courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
          <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
          <meshStandardMaterial color={lineColor} />
        </mesh>
        <mesh position={[courtW / 2, surfaceHeight + lineHeight / 2, 0]}>
          <boxGeometry args={[lineWidth / 12, lineHeight, courtL]} />
          <meshStandardMaterial color={lineColor} />
        </mesh>
        <mesh position={[0, surfaceHeight + lineHeight / 2, -courtL / 2]}>
          <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
          <meshStandardMaterial color={lineColor} />
        </mesh>
        <mesh position={[0, surfaceHeight + lineHeight / 2, courtL / 2]}>
          <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
          <meshStandardMaterial color={lineColor} />
        </mesh>
        <mesh position={[0, surfaceHeight + lineHeight / 2, 0]}>
          <boxGeometry args={[courtW, lineHeight, lineWidth / 12]} />
          <meshStandardMaterial color={lineColor} />
        </mesh>
      </group>
    );
  };

  return (
    <Canvas
      camera={{ position: [30, 30, 30], fov: 50 }}
      style={{ background: "linear-gradient(to bottom, #e5e7eb, #f3f4f6)" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} />
      {renderCourt()}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={100}
      />
      <gridHelper args={[200, 40, "#666", "#888"]} position={[0, -0.01, 0]} />
    </Canvas>
  );
};

export default Court3D;