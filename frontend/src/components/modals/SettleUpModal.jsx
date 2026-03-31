import { useState, useRef } from "react";
import { X, CheckCircle, HandCoins } from "lucide-react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sphere, MeshDistortMaterial, Trail, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { fmt } from "../common/utils";
import api from "../../lib/axios";
import Confetti from "react-confetti";

// A glowing coin that represents the money traveling
const AnimatedCoin = ({ startPos, endPos, onArrival }) => {
  const ref = useRef();
  let progress = 0;
  
  useFrame((state, delta) => {
    if (progress < 1) {
      progress += delta * 0.8; // speed
      if (progress >= 1) {
        progress = 1;
        if (onArrival) onArrival();
      }
      const newPos = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(...startPos),
        new THREE.Vector3(...endPos),
        progress
      );
      // Add a slight arc
      newPos.y += Math.sin(progress * Math.PI) * 1.5;
      ref.current.position.copy(newPos);
      ref.current.rotation.x += 0.1;
      ref.current.rotation.y += 0.2;
    }
  });

  return (
    <Trail width={1} length={4} color="#64ffda" attenuation={(t) => t * t}>
      <mesh ref={ref} position={startPos}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#64ffda" metalness={0.8} roughness={0.2} emissive="#64ffda" emissiveIntensity={0.5} />
      </mesh>
    </Trail>
  );
};

// Node corresponding to a person
const PersonNode = ({ position, name, color, distort }) => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group position={position}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial color={color} envMapIntensity={1} clearcoat={1} clearcoatRoughness={0} metalness={0.8} roughness={0.2} distort={distort} speed={2} />
        </Sphere>
        <Html position={[0, -1.5, 0]} center transform className="pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm tracking-widest whitespace-nowrap border border-white/20">
             {name}
          </div>
        </Html>
      </group>
    </Float>
  );
};

// Setup the scene
const Scene = ({ fromName, toName, isAnimating, onCoinArrived }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} color="#64ffda" intensity={1} />
      
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      
      {/* Node A: Payer */}
      <PersonNode position={[-3, 0, 0]} name={fromName} color="#ff3366" distort={0.4} />
      
      {/* Node B: Payee */}
      <PersonNode position={[3, 0, 0]} name={toName} color="#112240" distort={0.2} />

      {/* Animation flow */}
      {isAnimating && <AnimatedCoin startPos={[-3, 0, 0]} endPos={[3, 0, 0]} onArrival={onCoinArrived} />}
    </>
  );
};

const SettleUpModal = ({ groupId, transaction, memberMap, onClose, onSettled }) => {
  const { from, to, amount } = transaction;
  const fromName = memberMap[from] || from;
  const toName = memberMap[to] || to;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [settled, setSettled] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Call API
      await api.post("/api/expenses/settle", { groupId, toUserId: to, amount });
      
      // Trigger 3D animation sequence
      setIsAnimating(true);
      
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to settle up.");
      setLoading(false);
    }
  };

  const onCoinArrived = () => {
    setSettled(true);
    setTimeout(() => {
      onSettled();
      onClose();
    }, 3000); // give time for confetti and success read
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-splitr-midnight/60 backdrop-blur-sm" onClick={loading || isAnimating ? undefined : onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-lg h-full bg-splitr-navy border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {settled && <Confetti width={600} height={1000} recycle={false} numberOfPieces={300} />}
        
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <HandCoins className="text-splitr-mint w-6 h-6" /> Settle Up
          </h2>
          <button onClick={onClose} disabled={loading || isAnimating} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col relative">
           
           {/* 3D Container Box */}
           <div className="h-64 sm:h-80 w-full bg-gradient-to-b from-splitr-midnight to-splitr-navy relative shadow-inner overflow-hidden">
               {/* 3D Canvas */}
               <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
                  <Scene fromName={fromName} toName={toName} isAnimating={isAnimating} onCoinArrived={onCoinArrived} />
               </Canvas>
               {/* Overlay labels */}
               <div className="absolute top-4 inset-x-0 w-full text-center pointer-events-none">
                  <p className="text-splitr-mint font-bold tracking-[0.2em] text-xs uppercase opacity-80 shadow-black drop-shadow-lg">Debt Simplification</p>
               </div>
           </div>

           {/* Content Box */}
           <div className="p-8 flex flex-col flex-1 items-center justify-center text-center">
             {error && (
               <div className="mb-6 w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold text-left">
                 {error}
               </div>
             )}

             {!settled ? (
               <div className="space-y-4">
                 <p className="text-slate-400 text-lg">Send Payment Request</p>
                 <div className="glass-panel py-4 px-8 border border-white/5 bg-black/20 flex items-center gap-4">
                     <span className="text-xl font-bold text-splitr-neonred">{fromName}</span>
                     <span className="text-slate-400">→</span>
                     <span className="text-xl font-bold text-splitr-mint">{toName}</span>
                 </div>
                 <p className="text-5xl font-black text-white py-4 tracking-tighter shadow-glass">₹{fmt(amount)}</p>
               </div>
             ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                   <div className="w-20 h-20 rounded-full bg-splitr-mint/20 text-splitr-mint flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(100,255,218,0.3)]">
                      <CheckCircle className="w-10 h-10" />
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-2">Settled!</h3>
                   <p className="text-slate-400">The transaction has been successfully recorded.</p>
                </motion.div>
             )}
           </div>

        </div>

        {!settled && (
          <div className="p-6 border-t border-white/5 bg-splitr-navy/80 backdrop-blur-md">
            <button
              onClick={handleConfirm}
              disabled={loading || isAnimating}
              className="w-full relative overflow-hidden group py-4 rounded-xl text-splitr-midnight font-black text-lg tracking-wide bg-splitr-mint hover:bg-[#4df0c9] shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <div className="relative z-10">{loading ? "Processing..." : isAnimating ? "Animating..." : "Confirm Payment"}</div>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SettleUpModal;
