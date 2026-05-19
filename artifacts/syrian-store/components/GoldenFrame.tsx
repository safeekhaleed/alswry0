"use no memo";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  radius?: number;
  borderWidth?: number;
  style?: ViewStyle;
}

const GRAD_SIZE = 700;

export function GoldenFrame({ children, radius = 16, borderWidth = 1.5, style }: Props) {
  const spinRef = useRef(new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS === "web") return;
    const anim = Animated.loop(
      Animated.timing(spinRef.current, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Web: simple static golden border, no animation, no gradient rendering
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          {
            borderRadius: radius,
            borderWidth,
            borderColor: "#d4a017",
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Native: animated rotating gradient border
  const rotate = spinRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { overflow: "hidden", alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Animated.View
          style={{
            width: GRAD_SIZE,
            height: GRAD_SIZE,
            transform: [{ rotate }],
          }}
        >
          <LinearGradient
            colors={["#ffd700", "#d4a017", "#7a5c00", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "#7a5c00", "#d4a017", "#ffd700"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: GRAD_SIZE, height: GRAD_SIZE }}
          />
        </Animated.View>
      </View>
      <View
        style={{
          margin: borderWidth,
          borderRadius: radius - borderWidth,
          overflow: "hidden",
          flex: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}
