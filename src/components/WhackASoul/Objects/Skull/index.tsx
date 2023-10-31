import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, MathUtils, Mesh, MeshStandardMaterial, Vector3 } from "three";
import useGame from "../../../../Stores/useGame";

import { Model } from "./model";
import { useObjectsIntersect } from "../../../hooks/useObjectsIntersect";
import gsap, { Power4, TweenLite } from "gsap";

type Props = {
  position: Vector3;
  id: number;
};

const reuseableVec = new Vector3();
const reuseableVec2 = new Vector3();

export type Timeout = ReturnType<typeof setTimeout> | null;

const movementRange = {
  min: -3,
  max: 8,
};

const origin = new Vector3(1, 1, 1);
const baseSpeed = 0.26;

export const Skull = ({ position, id }: Props) => {
  const skullGroupRef = useRef<Group | null>(null);
  const wobbleRef = useRef<Group | null>(null);
  const ballMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const wallRef = useRef<Mesh | null>(null);
  const score = useGame((s) => s.score);
  const scoreUp = useGame((s) => s.scoreUp);
  const setHit = useGame((s) => s.setHit);
  const [attacking, setAttacking] = useState(false);
  const [attacked, setAttacked] = useState(false);
  const [speed, setSpeed] = useState(baseSpeed);
  const [multiplier, setMultiplier] = useState(0.8);
  const [hovered, setHovered] = useState(false);

  const [destination, setDestination] = useState(movementRange.min);

  const animationRef = useRef<TweenLite | null>(null);

  const hit = useGame((s) => s.hit);
  const damageUp = useGame((s) => s.damageUp);

  useEffect(() => {
    if (score > 10 && multiplier !== 1.2) {
      setMultiplier(1.2);
    } else if (score > 20 && multiplier !== 1.8) {
      setMultiplier(1.8);
    } else if (score > 30 && multiplier !== 2.5) {
      setMultiplier(2.5);
    }
  }, [score]);

  useEffect(() => {
    if (hit === id) {
      takeDamage();
    }
  }, [hit, id]);

  const { objectsIntersect } = useObjectsIntersect(skullGroupRef, wallRef);

  useEffect(() => {
    if (objectsIntersect && !attacking) {
      attack();
    }
  }, [objectsIntersect]);

  useEffect(() => {
    if (destination === movementRange.min) {
      setSpeed(3);
    } else {
      const rand = Math.random() * 0.04;
      setSpeed(baseSpeed + rand);
    }
  }, [destination]);

  const takeDamage = () => {
    setHit(0);

    if (attacked) return;

    setDestination(movementRange.min);
    setAttacking(false);

    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (skullGroupRef.current) {
      const scale = 0.8;
      skullGroupRef.current.scale.set(1, scale, 1);
    }
  };

  const attack = () => {
    if (wobbleRef.current) {
      setAttacking(true);

      const currentRotation = wobbleRef.current.rotation;
      animationRef.current = gsap
        .to(wobbleRef.current.rotation, {
          duration: 1,
          ease: Power4.easeInOut,
          keyframes: {
            "0%": currentRotation,
            "100%": new Vector3(0, Math.PI * 2, 0),
          },
          onComplete: () => {
            doDamage();
          },
        })
        .play();
    }
  };

  const doDamage = () => {
    damageUp();
    setAttacked(true);

    setTimeout(() => {
      setDestination(movementRange.min);
      setAttacked(false);
      setAttacking(false);
    }, 300);
  };

  useFrame(({ clock }, delta) => {
    if (ballMaterialRef.current) {
      ballMaterialRef.current.opacity = MathUtils.lerp(
        ballMaterialRef.current.opacity,
        hovered ? 0.1 : 0,
        0.1
      );
    }

    const elapsed = clock.getElapsedTime();
    if (wobbleRef.current) {
      const { x, z } = wobbleRef.current.position;
      const rate = attacked ? 30 : 9;
      wobbleRef.current.position.lerp(
        reuseableVec2.set(x, Math.sin(elapsed * rate) * 0.2, z),
        0.2
      );
      if (!attacking) {
        wobbleRef.current.rotation.y = Math.sin(elapsed * 7) * 0.4;
      } else if (attacked) {
        wobbleRef.current.rotation.y = Math.sin(elapsed * rate) * 0.4;
      }
    }

    if (!attacking && skullGroupRef?.current) {
      skullGroupRef.current.scale.lerp(origin, 0.1);
      const skullPosition = skullGroupRef?.current.position;

      skullPosition.lerp(
        reuseableVec.set(skullPosition.x, destination, skullPosition.z),
        0.01 * speed * multiplier * (delta * 100)
      );

      if (
        destination !== movementRange.max &&
        skullPosition.y < movementRange.min + 1
      ) {
        setDestination(movementRange.max);
      }
    }
  });

  return (
    <group>
      <group ref={skullGroupRef} position={position} rotation-y={Math.PI * 0.5}>
        <group ref={wobbleRef}>
          <mesh
            scale={1.1}
            position-y={1}
            onPointerEnter={(e) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              setHovered(false);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              scoreUp();
              setHit(id);
            }}
          >
            <sphereGeometry />
            <meshStandardMaterial
              ref={ballMaterialRef}
              emissive={"#fefdae"}
              emissiveIntensity={1}
              transparent
            />
          </mesh>

          <group
            visible={attacking}
            rotation-y={Math.PI * -0.5}
            position={[-0.3, 1.54, 0]}
          >
            <mesh scale={attacked ? 0.1 : 0.06} position={[0.2, 0, 0]}>
              <circleGeometry />
              <meshStandardMaterial
                emissive={attacked ? "white" : "yellow"}
                emissiveIntensity={30}
                opacity={1}
              />
            </mesh>

            <mesh scale={attacked ? 0.1 : 0.06} position={[-0.2, 0, 0]}>
              <circleGeometry />
              <meshStandardMaterial
                emissive={attacked ? "white" : "yellow"}
                emissiveIntensity={30}
                opacity={1}
              />
            </mesh>
          </group>
          <Model id={id} />
        </group>
      </group>

      <mesh
        ref={wallRef}
        position={[position.x, movementRange.max - 1, position.z]}
      >
        <boxGeometry />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};
