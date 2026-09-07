import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, Circle, G } from "react-native-svg";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { Magnetometer } from 'expo-sensors';
import { SafeAreaView } from 'react-native-safe-area-context';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";
import { vibrate, type VibrationStrength } from '@/vibration/haptics';
import NavigationBar from '@/components/NavigationBar';
import { request_MapsIdPath } from '@/api/api_maps_id_path';
import { request } from "@/api/client";
import { router, useLocalSearchParams, Redirect } from "expo-router";

const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const grid_W = 8;
const grid_H = 8;
const arrvlThresh = 0.5;
const heading_ConeDeg = 15;
const miniMap_sz = 150;
const metersPerCell = 1;

const rootBleedBg = '#ffffff';
const radarBaseBg = '#ffffff';

const startPt = { x: 0, y: 0 };

const joyBaseSz = 132;
const joyKnob_sz = 56;
const joyMaxRadius = (joyBaseSz - joyKnob_sz) / 2;

const moveSpeedCells = 1;
const moveTick_ms = 50;

const isJoyVisible = true;
const headingSmoothAlpha = 0.18;
const grid_PanPad = 8;

const Anim_G = Animated.createAnimatedComponent(G);
const AnimCircle = Animated.createAnimatedComponent(Circle);

const normAngle = (degVal: number) => {
  const wrp = degVal % 360;
  return wrp < 0 ? wrp + 360 : wrp;
};

const shortAngDelta = (fromAng: number, toAng: number) => {
  const dff = normAngle(toAng - fromAng);
  return dff > 180 ? dff - 360 : dff;
};

const angDistance = (angA: number, angB: number) => Math.abs(shortAngDelta(angA, angB));

export default function MapPage() {
  const { mapId, destinationId } = useLocalSearchParams();

  const rotAnim = useRef(new Animated.Value(0)).current;
  const rotValRef = useRef(0);

  const mapRotAnim = useRef(new Animated.Value(0)).current;
  const mapRotValRef = useRef(0);

  const camPanVal = useRef(new Animated.ValueXY()).current;

  const vibRunId = useRef(0);
  const isCorrctRef = useRef(false);

  const virtPos = useRef({ x: startPt.x, y: startPt.y });
  const currHeadingRef = useRef(0);

  const safePath_Ref = useRef<[number, number][]>([]);
  const tgtIdxRef = useRef(0);

  const [safe_path, setSafePath] = useState<[number, number][]>([]);
  const [distToNext, setDistToNext] = useState(0);
  const [turnDirection, setTurnDirection] = useState<'left' | 'right' | 'straight'>('straight');

  // MOVED INSIDE THE COMPONENT:
  const [end_PT, setEnd_PT] = useState<{ x: number, y: number } | null>(null);

  const joyKnobPan = useRef(new Animated.ValueXY()).current;
  const joyVecRef = useRef({ x: 0, y: 0 });
  const moveInterval_Ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const gridPathD = useMemo(() => {
    const minVal = -grid_PanPad;
    const max_X = grid_W + grid_PanPad;
    const max_Y = grid_H + grid_PanPad;
    const segs: string[] = [];
    for (let curX = minVal; curX <= max_X; curX += 1) {
      segs.push(`M${curX} ${minVal} L${curX} ${max_Y}`);
    }
    for (let curY = minVal; curY <= max_Y; curY += 1) {
      segs.push(`M${minVal} ${curY} L${max_X} ${curY}`);
    }
    return segs.join(' ');
  }, []);

  const rdarPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse_loop = Animated.loop(
      Animated.timing(rdarPulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    );
    pulse_loop.start();
    return () => {
      pulse_loop.stop();
    };
  }, [rdarPulse]);

  const pulse_Radius = rdarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.8] });
  const pulse_Opacity = rdarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  if (!mapId || !destinationId) {
    return <Redirect href={"/destination"} />;
  }

  const num_mapId = Number(mapId);

  // 1. FETCH DESTINATION COORDINATES
  useEffect(() => {
    let isCancelled = false;
    const fetchDest = async () => {
      try {
        const dests = await request<any[]>(`/api/destinations/?map_id=${num_mapId}`);
        const targetDest = dests.find(d => d.id === Number(destinationId));

        if (targetDest && targetDest.coordinates && !isCancelled) {
          let ex = 0, ey = 0;
          let coords = targetDest.coordinates;

          // Defensively parse in case Django sends a string instead of JSON
          if (typeof coords === 'string') {
            try { coords = JSON.parse(coords); } catch (e) { console.error("Parse error"); }
          }

          if (Array.isArray(coords)) {
            ex = Number(coords[0]);
            ey = Number(coords[1]);
          } else {
            ex = Number(coords.x);
            ey = Number(coords.y);
          }
          setEnd_PT({ x: ex, y: ey });
        }
      } catch (err) {
        console.error("Failed to fetch destination details:", err);
      }
    };
    fetchDest();
    return () => { isCancelled = true; };
  }, [num_mapId, destinationId]);

  const setSafePathHandler = useCallback((pArr: [number, number][]) => {
    if (!pArr || pArr.length === 0) return;
    safePath_Ref.current = pArr;
    tgtIdxRef.current = 0;
    setSafePath(pArr);
  }, []);

  const haltVibration = useCallback(() => {
    vibRunId.current += 1;
  }, []);

  const triggerVibLoop = useCallback(
    async (vibStrength: VibrationStrength) => {
      haltVibration();
      const thisRunId = vibRunId.current;
      try {
        while (vibRunId.current === thisRunId) {
          await vibrate(vibStrength);
          if (vibRunId.current !== thisRunId) break;
          await waitMs(50);
        }
      } catch (errObj) {
        console.error("[MapPage] Vibration execution failed:", errObj);
        haltVibration();
      }
    },
    [haltVibration],
  );

  // 2. FETCH PATH ONCE END_PT IS LOADED
  useEffect(() => {
    let isCancelled = false;
    const loadPathData = async () => {
      if (!end_PT) return; // Wait for dynamic coordinates

      try {
        const resData = await request_MapsIdPath(num_mapId, startPt.x, startPt.y, end_PT.x, end_PT.y);
        if (!resData || !resData.path || resData.path.length === 0) {
          console.error("[MapPage] API returned an empty or invalid path response.");
          return;
        }

        // Bulletproof Sanitize: Strips bad data to stop NaN math crashes completely
        const cleanPath = resData.path.map((pt: any) => {
          if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
          if (typeof pt === 'object' && pt !== null) return [Number(pt.x), Number(pt.y)];
          if (typeof pt === 'string') {
            const match = pt.match(/-?\d+(\.\d+)?/g);
            if (match && match.length >= 2) return [Number(match[0]), Number(match[1])];
          }
          return [NaN, NaN]; // Caught by filter below
        }).filter((pt: any) => Number.isFinite(pt[0]) && Number.isFinite(pt[1])) as [number, number][];

        if (cleanPath.length === 0) return;

        let finalPath = cleanPath;

        // Smart reverse: only reverses if the end of the array is closest to spawn
        const firstPtDist = Math.hypot(finalPath[0][0] - startPt.x, finalPath[0][1] - startPt.y);
        const lastPtDist = Math.hypot(finalPath[finalPath.length - 1][0] - startPt.x, finalPath[finalPath.length - 1][1] - startPt.y);

        if (lastPtDist < firstPtDist) {
          finalPath = finalPath.reverse();
        }

        if (!isCancelled) {
          setSafePathHandler(finalPath);
        }
      } catch (err) {
        console.error("[MapPage] Failed to fetch path from API:", err);
      }
    };
    loadPathData();
    return () => {
      isCancelled = true;
    };
  }, [setSafePathHandler, num_mapId, end_PT]);

  useEffect(() => {
    if (safe_path.length > 0 && (safe_path[0][0] !== startPt.x || safe_path[0][1] !== startPt.y)) {
      console.warn(
        "[MapPage] safePath did not start at the user's spawn position, prepending START."
      );
    }
  }, [safe_path]);

  const stopMoveLoop = useCallback(() => {
    if (moveInterval_Ref.current) {
      clearInterval(moveInterval_Ref.current);
      moveInterval_Ref.current = null;
    }
  }, []);

  const runMoveLoop = useCallback(() => {
    if (moveInterval_Ref.current) return;

    moveInterval_Ref.current = setInterval(() => {
      const { x: vecX, y: vecY } = joyVecRef.current;
      if (vecX === 0 && vecY === 0) return;

      const dtSecs = moveTick_ms / 1000;

      const radAngle = currHeadingRef.current * (Math.PI / 180);
      const rot_Vx = vecX * Math.cos(radAngle) - vecY * Math.sin(radAngle);
      const rot_Vy = vecX * Math.sin(radAngle) + vecY * Math.cos(radAngle);

      const nxt_X = virtPos.current.x + rot_Vx * moveSpeedCells * dtSecs;
      const nxt_Y = virtPos.current.y + rot_Vy * moveSpeedCells * dtSecs;

      virtPos.current = { x: nxt_X, y: nxt_Y };

      camPanVal.setValue({ x: nxt_X, y: nxt_Y });

      const curPath = safePath_Ref.current;
      const cIdx = tgtIdxRef.current;
      if (curPath.length > 0 && cIdx < curPath.length) {
        const curTarget = curPath[cIdx];
        if (curTarget && curTarget.length >= 2) {
          const distToTgt = Math.hypot(curTarget[0] - nxt_X, curTarget[1] - nxt_Y);

          const newDistLabel = Math.round(distToTgt * metersPerCell);
          setDistToNext((prevDist) => (prevDist !== newDistLabel ? newDistLabel : prevDist));

          if (distToTgt < arrvlThresh && cIdx < curPath.length - 1) {
            tgtIdxRef.current = cIdx + 1;
          }
        }
      }
    }, moveTick_ms);
  }, [camPanVal]);

  const resetJoyStick = useCallback(() => {
    joyVecRef.current = { x: 0, y: 0 };
    stopMoveLoop();
    Animated.spring(joyKnobPan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [joyKnobPan, stopMoveLoop]);

  const onJoyMove = useCallback(
    (_evt: GestureResponderEvent, gState: PanResponderGestureState) => {
      const { dx, dy } = gState;
      const totalDist = Math.hypot(dx, dy);
      const clampedDist = Math.min(totalDist, joyMaxRadius);
      const moveAngle = Math.atan2(dy, dx);

      const kX = Math.cos(moveAngle) * clampedDist;
      const kY = Math.sin(moveAngle) * clampedDist;

      joyKnobPan.setValue({ x: kX, y: kY });

      joyVecRef.current = {
        x: kX / joyMaxRadius,
        y: kY / joyMaxRadius,
      };
    },
    [joyKnobPan],
  );

  const joyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        runMoveLoop();
      },
      onPanResponderMove: onJoyMove,
      onPanResponderRelease: resetJoyStick,
      onPanResponderTerminate: resetJoyStick,
    }),
  ).current;

  useEffect(() => {
    return () => {
      stopMoveLoop();
    };
  }, [stopMoveLoop]);

  useEffect(() => {
    let sensorSub: { remove: () => void } | null = null;
    let smooth_heading = 0;
    let isHeadingInit = false;

    try {
      Magnetometer.setUpdateInterval(100);

      sensorSub = Magnetometer.addListener(({ x: rawX, y: rawY }) => {
        if (typeof rawX !== 'number' || typeof rawY !== 'number') {
          return;
        }

        const calculatedHeading = normAngle(Math.atan2(rawY, rawX) * (180 / Math.PI));

        if (!isHeadingInit) {
          smooth_heading = calculatedHeading;
          isHeadingInit = true;
        } else {
          const delta_smooth = shortAngDelta(smooth_heading, calculatedHeading);
          smooth_heading = normAngle(smooth_heading + delta_smooth * headingSmoothAlpha);
        }

        const headVal = smooth_heading;
        currHeadingRef.current = headVal;

        const pathArr = safePath_Ref.current;
        const curTgtIdx = tgtIdxRef.current;
        const isActiveTgt = pathArr.length > 0 && curTgtIdx < pathArr.length;

        let tgtAngVal = 0;

        if (isActiveTgt) {
          const pointTarget = pathArr[curTgtIdx];
          if (!pointTarget || pointTarget.length < 2) return;

          const [tx, ty] = pointTarget;
          const deltaX = tx - virtPos.current.x;
          const deltaY = ty - virtPos.current.y;
          tgtAngVal = normAngle(Math.atan2(deltaX, -deltaY) * (180 / Math.PI));

          const angDiff = angDistance(tgtAngVal, headVal);
          const isPointedCorrect = angDiff <= heading_ConeDeg;

          const signedDelta = shortAngDelta(headVal, tgtAngVal);
          const newDirection: 'left' | 'right' | 'straight' = isPointedCorrect
            ? 'straight'
            : signedDelta > 0
              ? 'right'
              : 'left';
          setTurnDirection((prevDir) => (prevDir !== newDirection ? newDirection : prevDir));

          if (isPointedCorrect && !isCorrctRef.current) {
            isCorrctRef.current = true;
            triggerVibLoop('success');
          } else if (!isPointedCorrect && isCorrctRef.current) {
            isCorrctRef.current = false;
            haltVibration();
          }
        } else if (isCorrctRef.current) {
          isCorrctRef.current = false;
          haltVibration();
        }

        if (!isActiveTgt) {
          setTurnDirection((prevDir) => (prevDir !== 'straight' ? 'straight' : prevDir));
        }

        const rawRotDeg = normAngle(tgtAngVal - headVal);
        const currModDeg = normAngle(rotValRef.current);
        const rotDiff = shortAngDelta(currModDeg, rawRotDeg);
        rotValRef.current += rotDiff;

        Animated.timing(rotAnim, {
          toValue: rotValRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        const raw_MapRot = normAngle(-headVal);
        const currMapModDeg = normAngle(mapRotValRef.current);
        const mapDeltaRot = shortAngDelta(currMapModDeg, raw_MapRot);
        mapRotValRef.current += mapDeltaRot;

        Animated.timing(mapRotAnim, {
          toValue: mapRotValRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      });
    } catch (sensorErr) {
      console.error("[MapPage] Failed to initialize Magnetometer listener:", sensorErr);
    }

    return () => {
      if (sensorSub) {
        sensorSub.remove();
      }
      haltVibration();
    };
  }, [rotAnim, mapRotAnim, triggerVibLoop, haltVibration]);

  const rotInterp = rotAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const mapRotInterp = mapRotAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const world_OffX = camPanVal.x.interpolate({
    inputRange: [0, grid_W],
    outputRange: [grid_W / 2, grid_W / 2 - grid_W],
  });

  const world_OffY = camPanVal.y.interpolate({
    inputRange: [0, grid_H],
    outputRange: [grid_H / 2, grid_H / 2 - grid_H],
  });

  const isAnchorReq =
    safe_path.length > 0 && (safe_path[0][0] !== startPt.x || safe_path[0][1] !== startPt.y);

  const visPathPts: [number, number][] = isAnchorReq
    ? [[startPt.x, startPt.y] as [number, number], ...safe_path]
    : safe_path;

  const svgPathStr = useMemo(() => {
    if (!visPathPts || visPathPts.length === 0) return undefined;
    return visPathPts
      .map((pt, ind) => `${ind === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`)
      .join(' ');
  }, [visPathPts]);

  // Fallback to 0 if distance ever tries to render as NaN
  const distToNextLabel = isNaN(distToNext) ? 0 : distToNext;

  const turnLabel =
    turnDirection === 'left' ? 'turn left' : turnDirection === 'right' ? 'turn right' : 'straight ahead';

  return (
    <SafeAreaView style={[commonStyles.screen, localStyles.safeAreaRoot]} edges={['top', 'bottom']}>
      <View style={indexStyles.topFrame}>

        <View style={indexStyles.hudPanel}>
          <Text style={indexStyles.hudLabel}>TARGET DISTANCE</Text>
          <Text style={indexStyles.hudValue}>{distToNextLabel}m</Text>
          <Text style={indexStyles.hudSubValue}>{turnLabel}</Text>
        </View>

        <View style={localStyles.miniMapContainer}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ rotate: mapRotInterp }] }
            ]}
          >
            <Svg
              width={miniMap_sz}
              height={miniMap_sz}
              viewBox={`0 0 ${grid_W} ${grid_H}`}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <RadialGradient id="mapBackdrop" cx="50%" cy="50%" r="65%">
                  <Stop offset="0" stopColor="#eaf7f5" stopOpacity={1} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={1} />
                </RadialGradient>
                <LinearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0" stopColor="#26ac49" stopOpacity={0.9} />
                  <Stop offset="1" stopColor="#5cbdb9" stopOpacity={1} />
                </LinearGradient>
              </Defs>

              <Circle cx={grid_W / 2} cy={grid_H / 2} r={grid_W} fill="url(#mapBackdrop)" />

              {[1, 2, 3, 4].map((ringR, ringIdx) => (
                <Circle
                  key={`radar-ring-${ringR}`}
                  cx={grid_W / 2}
                  cy={grid_H / 2}
                  r={ringR}
                  stroke="#5cbdb9"
                  strokeOpacity={0.22 - ringIdx * 0.04}
                  strokeWidth={0.045}
                  fill="none"
                />
              ))}

              <Anim_G translateX={world_OffX} translateY={world_OffY}>
                <Path
                  d={gridPathD}
                  stroke="#d7ecea"
                  strokeWidth={0.07}
                />

                {svgPathStr && (
                  <>
                    <Path
                      d={svgPathStr}
                      stroke="#5cbdb9"
                      strokeOpacity={0.4}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    <Path
                      d={svgPathStr}
                      stroke="url(#pathGradient)"
                      strokeWidth={0.6}
                      strokeDasharray="0.45 0.35"
                      strokeLinecap="round"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </Anim_G>

              <AnimCircle
                cx={grid_W / 2}
                cy={grid_H / 2}
                r={pulse_Radius}
                stroke="#5cbdb9"
                strokeWidth={0.08}
                fill="none"
                opacity={pulse_Opacity}
              />
              <Circle
                cx={grid_W / 2}
                cy={grid_H / 2}
                r={0.15}
                fill="#fbe3e8"
                stroke="#5cbdb9"
                strokeWidth={0.05}
              />
            </Svg>
          </Animated.View>
        </View>

      </View>

      <View style={indexStyles.centerFrame}>
        <View style={localStyles.centerStack}>
          <Animated.View
            style={{
              transform: [{ rotate: rotInterp }],
              transformOrigin: "center center",
              shadowColor: "#2C3E50",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <Svg width={150} height={171} viewBox="0 0 70 80">
              <Defs>
                <LinearGradient id="cursorGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#26ac49" stopOpacity={1} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Path
                d="M35 0 L70 68 L35 54 L0 68 Z"
                fill="url(#cursorGradient)"
                stroke="#5cbdb9"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>

          <View
            style={[localStyles.joystickBase, !isJoyVisible && localStyles.joystickHidden]}
            {...joyPanResponder.panHandlers}
          >
            <Animated.View
              style={[
                localStyles.joystickKnob,
                !isJoyVisible && localStyles.joystickHidden,
                { transform: joyKnobPan.getTranslateTransform() },
              ]}
            />
          </View>
        </View>
      </View>

      <NavigationBar />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  safeAreaRoot: {
    flex: 1,
    backgroundColor: rootBleedBg,
  },
  miniMapContainer: {
    width: miniMap_sz,
    height: miniMap_sz,
    backgroundColor: radarBaseBg,
    borderRadius: miniMap_sz / 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    marginTop: 28,
    width: joyBaseSz,
    height: joyBaseSz,
    borderRadius: joyBaseSz / 2,
    backgroundColor: 'rgba(92, 189, 185, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(92, 189, 185, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickKnob: {
    width: joyKnob_sz,
    height: joyKnob_sz,
    borderRadius: joyKnob_sz / 2,
    backgroundColor: '#5cbdb9',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  joystickHidden: {
    opacity: 0,
  },
});