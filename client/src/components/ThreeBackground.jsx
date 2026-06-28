import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Lightweight, premium 3D background: softly floating geometric objects and
 * drifting particles with smooth camera movement. Pauses when off-screen and
 * caps the pixel ratio so it never hurts performance.
 */
export default function ThreeBackground({ density = 1 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
    });

    // Lighting for a premium look.
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xff5566, 1.1);
    key.position.set(5, 6, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0xff2b3d, 1.4, 60);
    rim.position.set(-8, -4, 6);
    scene.add(rim);

    // Floating geometric objects.
    const objects = [];
    const geos = [
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.TorusGeometry(0.8, 0.32, 16, 40),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.DodecahedronGeometry(1.0, 0),
    ];
    const count = Math.round(7 * density);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.99, 0.7, 0.55 + Math.random() * 0.1),
        roughness: 0.35,
        metalness: 0.25,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geos[i % geos.length], mat);
      mesh.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10 - 3
      );
      const s = 0.5 + Math.random() * 0.9;
      mesh.scale.setScalar(s);
      mesh.userData = {
        rs: (Math.random() - 0.5) * 0.4,
        fs: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      };
      scene.add(mesh);
      objects.push(mesh);
    }

    // Soft drifting particles.
    const pCount = Math.round(420 * density);
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 6;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xff6b78, size: 0.07, transparent: true, opacity: 0.55 })
    );
    scene.add(particles);

    let width = 0;
    let height = 0;
    const resize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Subtle parallax following the pointer.
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);

    let raf;
    let running = true;
    const clock = new THREE.Clock();
    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      objects.forEach((m) => {
        m.rotation.x += m.userData.rs * 0.01;
        m.rotation.y += m.userData.rs * 0.013;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.fs + m.userData.phase) * 0.6;
      });
      particles.rotation.y = t * 0.02;
      camera.position.x += (target.x * 1.6 - camera.position.x) * 0.03;
      camera.position.y += (-target.y * 1.0 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    // Pause when the tab is hidden to save resources.
    const onVis = () => {
      running = !document.hidden;
      if (running) animate();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      geos.forEach((g) => g.dispose());
      objects.forEach((m) => m.material.dispose());
      pGeo.dispose();
      particles.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [density]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
