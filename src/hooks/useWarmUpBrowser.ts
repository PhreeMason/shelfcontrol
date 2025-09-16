import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
    return () => {};
  }, []);
};
