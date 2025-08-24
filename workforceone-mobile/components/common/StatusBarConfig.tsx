import React from 'react';
import { StatusBar } from 'react-native';
import { Platform } from 'react-native';

interface Props {
  barStyle?: 'default' | 'light-content' | 'dark-content';
  backgroundColor?: string;
}

export default function StatusBarConfig({ 
  barStyle = 'light-content', 
  backgroundColor = 'transparent' 
}: Props) {
  return (
    <StatusBar 
      barStyle={barStyle}
      backgroundColor={backgroundColor}
      translucent={false}
      {...Platform.select({
        android: {
          backgroundColor: backgroundColor,
        }
      })}
    />
  );
}