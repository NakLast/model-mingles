import React from "react"
import { Canvas } from "@react-three/fiber"

import Character from "./components/Character"

const App: React.FC = () => {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 20 }}>
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
      />
      <Character
        model="assets/Nong7.glb"
        animate={["Idle"]}
        scale={2}
        position={[0, -2.6, 0]}
        message={""}
      />
    </Canvas>
  )
}

export default App