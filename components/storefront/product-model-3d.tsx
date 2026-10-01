"use client";

import { useEffect, useRef, useState } from "react";

// Ürün sayfası galerisindeki 3D kare (1 Eki 2026): products.model_3d_url
// dolu ürünlerde .glb modeli gösterir, müşteri sürükleyerek döndürür.
// three.js yalnız bu bileşen açılınca indirilir (dinamik import); kare
// açılmadıkça sayfaya yük binmez.
export function ProductModel3D({ src, label }: { src: string; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const [THREE, { OrbitControls }, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        const canvas = renderer.domElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.cursor = "grab";
        canvas.setAttribute("aria-label", label);
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;

        const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        // Masaüstünde tekerlek sayfayı kaydırmaya devam etsin; yakınlaştırma
        // yalnız dokunmatikte (iki parmak).
        controls.enableZoom = window.matchMedia("(pointer: coarse)").matches;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        controls.autoRotate = !reducedMotion;
        controls.autoRotateSpeed = 1.6;
        const stopAutoRotate = () => {
          controls.autoRotate = false;
        };
        canvas.addEventListener("pointerdown", stopAutoRotate);

        const resize = () => {
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        cleanup = () => {
          observer.disconnect();
          canvas.removeEventListener("pointerdown", stopAutoRotate);
          renderer.setAnimationLoop(null);
          controls.dispose();
          environment.dispose();
          pmrem.dispose();
          renderer.dispose();
          canvas.remove();
        };

        const gltf = await new GLTFLoader().loadAsync(src);
        if (disposed) return;
        gltf.scene.traverse((object) => {
          const mesh = object as import("three").Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            // Baskı katmanları (etiket, logo) saydam düzlemler: derinliğe yazmasın.
            if (material.transparent) {
              material.depthWrite = false;
              mesh.renderOrder = 2;
            }
          }
        });
        scene.add(gltf.scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const distance = (sphere.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.12;
        const direction = new THREE.Vector3(-0.5, 0.35, 0.8).normalize();
        camera.position.copy(sphere.center).addScaledVector(direction, distance);
        camera.near = distance / 100;
        camera.far = distance * 10;
        camera.updateProjectionMatrix();
        controls.target.copy(sphere.center);
        controls.minDistance = distance * 0.45;
        controls.maxDistance = distance * 1.6;
        controls.update();

        renderer.setAnimationLoop(() => {
          controls.update();
          renderer.render(scene, camera);
        });
        setStatus("ready");
      } catch (error) {
        console.error("[product-model-3d]", error);
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [src, label]);

  return (
    <div ref={hostRef} className="relative h-full w-full" style={{ touchAction: "none" }}>
      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-black/50">
          {status === "loading" ? "3D model yükleniyor…" : "3D model yüklenemedi"}
        </div>
      ) : null}
    </div>
  );
}
