import { Suspense, useEffect } from "react";
import "./App.css";
import { Canvas, useThree } from "@react-three/fiber";

import { ACESFilmicToneMapping, PCFSoftShadowMap, Vector3 } from "three";
import { WhackASoul } from "./components/WhackASoul";
import { Bloom, EffectComposer, Outline } from "@react-three/postprocessing";
import { BlendFunction, Resolution } from "postprocessing";

function App() {
  return (
    <Canvas
      gl={{
        toneMappingExposure: 3,
        toneMapping: ACESFilmicToneMapping,
      }}
      shadows={{
        type: PCFSoftShadowMap,
      }}
      camera={{
        fov: 45,
        near: 1,
        far: 500,
        position: [0, 11, 16],
      }}
    >
      <Guts />
    </Canvas>
  );
}

const Guts = () => {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(new Vector3(0, 3, 0));
  }, []);
  return (
    <Suspense fallback={null}>
      <EffectComposer autoClear={false} multisampling={8}>
        <Bloom
          luminanceThreshold={1}
          mipmapBlur
          resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
          resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
        />
        <Outline
          blur
          edgeStrength={4}
          blendFunction={BlendFunction.SCREEN} // set this to BlendFunction.ALPHA for dark outlines
          hiddenEdgeColor={0xffffff}
          visibleEdgeColor={0xffffff}
        />
      </EffectComposer>

      <color attach='background' args={["#000000"]} />
      <WhackASoul />
    </Suspense>
  );
};

export default App;
