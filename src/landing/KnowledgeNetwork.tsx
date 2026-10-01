import React, { useRef, useEffect, useState } from 'react';

/**
 * KnowledgeNetwork (3D Rotating Multi-Node AI Knowledge Graph)
 * - Proyeksi perspektif 3D matematika real-time (X, Y, Z)
 * - Rotasi spasial 3D kontinu dengan kontrol rotasi kursor/sentuh
 * - 31 Node terdesentralisasi (Pusat RAG Hub + 6 Pilar Pengetahuan + 24 Sub-Node Vektor)
 * - Pulsa partikel foton bergerak di sepanjang garis 3D
 * - Kedalaman visual (Depth-sorting, depth-blur & opacity scaling)
 */
interface NetworkNode {
  id: string;
  name: string;
  category: 'core' | 'pillar' | 'sub';
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  icon?: string;
  parentId?: string;
  // Fields hasil proyeksi
  x2d?: number;
  y2d?: number;
  z2?: number;
  perspective?: number;
  alpha?: number;
  renderedRadius?: number;
}

interface NetworkEdge {
  from: NetworkNode;
  to: NetworkNode;
  type: 'core' | 'mesh' | 'cross' | 'branch' | 'submesh';
  weight: number;
}

export default function KnowledgeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Parameter rotasi & interaksi
  const rotationRef = useRef({
    angleX: 0.2,
    angleY: 0,
    velocityX: 0,
    velocityY: 0.005, // auto rotation speed
    isInteracting: false,
    lastMouseX: 0,
    lastMouseY: 0,
    rippleWave: 0,
  });

  // Efek pulsa periodik
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger gelombang pulsa di tengah
      rotationRef.current.rippleWave = 1.0;
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener('resize', handleResize);

    // ==========================================
    // DEFINISI 3D NODES & TOPOLOGI JARINGAN
    // ==========================================
    // 1. Central Core Node (RAG Hub)
    const centralNode: NetworkNode = {
      id: 'core',
      name: 'RAG Core AI',
      category: 'core',
      x: 0,
      y: 0,
      z: 0,
      radius: 20,
      color: '#2563EB',
    };

    // 2. 6 Pilar Utama (Major Knowledge Clusters)
    const majorPillars = [
      { id: 'sop', name: 'SOP & Prosedur', color: '#3B82F6', icon: 'DOC' },
      { id: 'legal', name: 'Kontrak Hukum', color: '#6366F1', icon: 'LAW' },
      { id: 'database', name: 'Basis Data SQL', color: '#0EA5E9', icon: 'DB' },
      { id: 'finance', name: 'Audit Keuangan', color: '#10B981', icon: 'FIN' },
      { id: 'research', name: 'Jurnal Riset', color: '#8B5CF6', icon: 'RST' },
      { id: 'technical', name: 'Spesifikasi API', color: '#06B6D4', icon: 'API' },
    ];

    const R_MAJOR = 130; // Radius bola pilar utama
    const pillarNodes: NetworkNode[] = majorPillars.map((pillar, i) => {
      // Distribusi di permukaan bola 3D (Fibonacci sphere / polar)
      const phi = Math.acos(-1 + (2 * i) / majorPillars.length);
      const theta = Math.sqrt(majorPillars.length * Math.PI) * phi;
      return {
        id: pillar.id,
        name: pillar.name,
        category: 'pillar',
        x: R_MAJOR * Math.cos(theta) * Math.sin(phi),
        y: R_MAJOR * Math.sin(theta) * Math.sin(phi),
        z: R_MAJOR * Math.cos(phi),
        radius: 11,
        color: pillar.color,
        icon: pillar.icon,
      };
    });

    // 3. 24 Sub-Nodes (Vektor embeddings & file serpihan)
    const R_OUTER = 175;
    const subNodes: NetworkNode[] = [];
    const subNodeNames = [
      'PDF OCR', 'Pasal 12', 'Vektor 1536d', 'Chunking', 'Token Cache', 'Neraca Q3',
      'Metrik KPI', 'Sitasi Hal.4', 'Enkripsi RSA', 'Faktur 2025', 'Policy Auth', 'Embeddings',
      'Prompt Cache', 'Cross-Encoder', 'Semantic Rank', 'JSON Schema', 'Rest API v2', 'Manual SOP',
      'Audit Trail', 'Paper Medis', 'Abstrak 2024', 'ISO 27001', 'Arsip Cloud', 'Dataset KB'
    ];

    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(-1 + (2 * i + 1) / 24);
      const theta = Math.sqrt(24 * Math.PI) * phi;
      // Sedikit jitter acak pada radius
      const r = R_OUTER + Math.sin(i * 3) * 15;
      const parentPillar = pillarNodes[i % pillarNodes.length];

      subNodes.push({
        id: `sub-${i}`,
        name: subNodeNames[i] || `Node ${i + 1}`,
        category: 'sub',
        x: r * Math.cos(theta) * Math.sin(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(phi),
        radius: 5.5,
        color: parentPillar.color,
        parentId: parentPillar.id,
      });
    }

    const allNodes: NetworkNode[] = [centralNode, ...pillarNodes, ...subNodes];

    // ==========================================
    // DEFINISI 3D EDGES / GARIS SINAPSIS
    // ==========================================
    const edges: NetworkEdge[] = [];

    // Hubungkan Pusat ke semua 6 Pilar Utama
    pillarNodes.forEach((p) => {
      edges.push({ from: centralNode, to: p, type: 'core', weight: 1.5 });
    });

    // Hubungkan Antar-Pilar (Lingkar Geodesik)
    for (let i = 0; i < pillarNodes.length; i++) {
      edges.push({
        from: pillarNodes[i],
        to: pillarNodes[(i + 1) % pillarNodes.length],
        type: 'mesh',
        weight: 0.8,
      });
      // Diagonal cross-link
      if (i % 2 === 0) {
        edges.push({
          from: pillarNodes[i],
          to: pillarNodes[(i + 3) % pillarNodes.length],
          type: 'cross',
          weight: 0.5,
        });
      }
    }

    // Hubungkan Sub-node ke Induk Pilar & Tetangga
    subNodes.forEach((sub, idx) => {
      const parent = pillarNodes.find((p) => p.id === sub.parentId);
      if (parent) {
        edges.push({ from: parent, to: sub, type: 'branch', weight: 0.7 });
      }
      // Hubungkan ke tetangga sub-node terdekat
      if (idx > 0 && idx % 3 === 0) {
        edges.push({ from: sub, to: subNodes[idx - 1], type: 'submesh', weight: 0.4 });
      }
    });

    // Pulsa Partikel Foton yang meluncur di sepanjang edge
    const pulses = edges.map((edge, idx) => ({
      edge,
      progress: (idx * 0.15) % 1,
      speed: 0.006 + (idx % 4) * 0.003,
      size: 1.5 + (idx % 2),
      direction: idx % 2 === 0 ? 1 : -1,
    }));

    // ==========================================
    // RENDER LOOP & 3D PROJECTION
    // ==========================================
    const fov = 380;
    const cameraZ = 340;

    const render = () => {
      const rot = rotationRef.current;

      // Update rotasi dinamis (rotasi otomatis jika tidak sedang di-drag)
      if (!rot.isInteracting) {
        rot.angleY += rot.velocityY;
        rot.angleX = 0.2 + Math.sin(Date.now() * 0.001) * 0.12;
      }

      // Smooth decaying wave pulse
      if (rot.rippleWave > 0) {
        rot.rippleWave -= 0.015;
      }

      ctx.clearRect(0, 0, width, height);

      const dpr = window.devicePixelRatio || 1;
      const centerX = width / 2;
      const centerY = height / 2;

      const cosX = Math.cos(rot.angleX);
      const sinX = Math.sin(rot.angleX);
      const cosY = Math.cos(rot.angleY);
      const sinY = Math.sin(rot.angleY);

      // 1. Transformasikan seluruh titik 3D ke 2D
      const projectedNodes: NetworkNode[] = allNodes.map((node) => {
        // Rotasi seputar sumbu Y
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // Rotasi seputar sumbu X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        // Proyeksi Perspektif
        const perspective = fov / (cameraZ + z2);
        const screenX = centerX + x1 * perspective * (width / 520);
        const screenY = centerY + y2 * perspective * (height / 520);

        // Kedalaman visual (depth)
        const depthNorm = (z2 + R_OUTER) / (R_OUTER * 2); // 0 (belakang) s.d 1 (depan)
        const alpha = Math.max(0.2, Math.min(1, 0.35 + depthNorm * 0.65));
        const renderedRadius = Math.max(2, node.radius * perspective * 0.9);

        return {
          ...node,
          x2d: screenX,
          y2d: screenY,
          z2,
          perspective,
          alpha,
          renderedRadius,
        };
      });

      // 2. Render Lingkaran Spasial Orbital / Medan Energi Latar
      ctx.save();
      ctx.strokeStyle = 'rgba(191, 219, 254, 0.35)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 190 * (width / 520), 75 * (height / 520), rot.angleX, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Render Garis Sinapsis / Edges
      edges.forEach((edge) => {
        const p1 = projectedNodes.find((n) => n.id === edge.from.id);
        const p2 = projectedNodes.find((n) => n.id === edge.to.id);
        if (!p1 || !p2 || p1.x2d === undefined || p2.x2d === undefined || p1.y2d === undefined || p2.y2d === undefined) return;

        const avgAlpha = ((p1.alpha ?? 0.5) + (p2.alpha ?? 0.5)) / 2;
        ctx.save();

        if (edge.type === 'core') {
          ctx.strokeStyle = `rgba(37, 99, 235, ${avgAlpha * 0.75})`;
          ctx.lineWidth = 1.6 * dpr;
        } else if (edge.type === 'mesh') {
          ctx.strokeStyle = `rgba(96, 165, 250, ${avgAlpha * 0.55})`;
          ctx.lineWidth = 1.0 * dpr;
        } else {
          ctx.strokeStyle = `rgba(147, 197, 253, ${avgAlpha * 0.35})`;
          ctx.lineWidth = 0.7 * dpr;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x2d, p1.y2d ?? 0);
        ctx.lineTo(p2.x2d, p2.y2d ?? 0);
        ctx.stroke();
        ctx.restore();
      });

      // 4. Render Pulsa Data Foton yang Meluncur
      pulses.forEach((pulse) => {
        const p1 = projectedNodes.find((n) => n.id === pulse.edge.from.id);
        const p2 = projectedNodes.find((n) => n.id === pulse.edge.to.id);
        if (!p1 || !p2 || p1.x2d === undefined || p2.x2d === undefined || p1.y2d === undefined || p2.y2d === undefined) return;

        pulse.progress += pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;

        const t = pulse.direction === 1 ? pulse.progress : 1 - pulse.progress;
        const curX = p1.x2d + (p2.x2d - p1.x2d) * t;
        const curY = (p1.y2d ?? 0) + ((p2.y2d ?? 0) - (p1.y2d ?? 0)) * t;
        const curAlpha = ((p1.alpha ?? 0.5) + (p2.alpha ?? 0.5)) / 2;

        ctx.save();
        ctx.fillStyle = `rgba(37, 99, 235, ${curAlpha * 0.95})`;
        ctx.shadowColor = '#60A5FA';
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(curX, curY, pulse.size * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Urutkan Node berdasarkan kedalaman Z (Depth-sorting dari belakang ke depan)
      const sortedNodes = [...projectedNodes].sort((a, b) => (a.z2 ?? 0) - (b.z2 ?? 0));

      // 6. Gambar Node
      sortedNodes.forEach((node) => {
        if (
          node.x2d === undefined ||
          node.y2d === undefined ||
          node.renderedRadius === undefined ||
          node.alpha === undefined
        ) {
          return;
        }

        ctx.save();

        if (node.category === 'core') {
          // Central Core Glow Effect
          const glowGrad = ctx.createRadialGradient(
            node.x2d, node.y2d, node.renderedRadius * 0.4,
            node.x2d, node.y2d, node.renderedRadius * 2.5
          );
          glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.45)');
          glowGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.x2d, node.y2d, node.renderedRadius * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Gelombang Ripple jika aktif
          if (rot.rippleWave > 0) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${rot.rippleWave * 0.8})`;
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.arc(node.x2d, node.y2d, node.renderedRadius * (1 + (1 - rot.rippleWave) * 3), 0, Math.PI * 2);
            ctx.stroke();
          }

          // Core Sphere Body
          const coreGrad = ctx.createLinearGradient(
            node.x2d - node.renderedRadius, node.y2d - node.renderedRadius,
            node.x2d + node.renderedRadius, node.y2d + node.renderedRadius
          );
          coreGrad.addColorStop(0, '#3B82F6');
          coreGrad.addColorStop(0.5, '#2563EB');
          coreGrad.addColorStop(1, '#1D4ED8');

          ctx.fillStyle = coreGrad;
          ctx.shadowColor = 'rgba(37, 99, 235, 0.8)';
          ctx.shadowBlur = 12 * dpr;
          ctx.beginPath();
          ctx.arc(node.x2d, node.y2d, node.renderedRadius, 0, Math.PI * 2);
          ctx.fill();

          // Core Inner Ring
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.8 * dpr;
          ctx.beginPath();
          ctx.arc(node.x2d, node.y2d, node.renderedRadius * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        } else if (node.category === 'pillar') {
          // Major Pillar Node
          ctx.fillStyle = node.color;
          ctx.globalAlpha = node.alpha;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 8 * dpr;

          ctx.beginPath();
          ctx.arc(node.x2d, node.y2d, node.renderedRadius, 0, Math.PI * 2);
          ctx.fill();

          // White ring border
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();

          // Teks Label jika posisinya di depan (z2 > -40)
          if ((node.z2 ?? 0) > -40) {
            ctx.font = `bold ${Math.round(9 * dpr)}px sans-serif`;
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#0F172A';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText(node.name, node.x2d, node.y2d + node.renderedRadius + 14 * dpr);
          }
        } else {
          // Sub-Node Partikel Vektor
          ctx.fillStyle = node.color;
          ctx.globalAlpha = node.alpha * 0.85;
          ctx.beginPath();
          ctx.arc(node.x2d, node.y2d, node.renderedRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // INTERAKSI POINTER (DRAG 3D UNTUK MEMUTAR)
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    rotationRef.current.isInteracting = true;
    rotationRef.current.lastMouseX = e.clientX;
    rotationRef.current.lastMouseY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - rotationRef.current.lastMouseX;
    const deltaY = e.clientY - rotationRef.current.lastMouseY;

    rotationRef.current.angleY += deltaX * 0.008;
    rotationRef.current.angleX += deltaY * 0.008;

    // Batasi sudut elevasi X agar tidak terbalik ekstrem
    rotationRef.current.angleX = Math.max(-0.9, Math.min(0.9, rotationRef.current.angleX));

    rotationRef.current.lastMouseX = e.clientX;
    rotationRef.current.lastMouseY = e.clientY;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Kembalikan ke rotasi halus otomatis setelah 400ms
    setTimeout(() => {
      rotationRef.current.isInteracting = false;
    }, 400);
  };

  return (
    <div className="relative w-full max-w-[560px] h-[460px] sm:h-[500px] mx-auto flex items-center justify-center select-none">
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(219, 234, 254, 0.65) 0%, rgba(240, 249, 255, 0.3) 50%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Canvas 3D Math Projection */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-full relative z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} touch-none`}
        title="Geser kursor untuk memutar jaringan 3D"
      />
    </div>
  );
}
