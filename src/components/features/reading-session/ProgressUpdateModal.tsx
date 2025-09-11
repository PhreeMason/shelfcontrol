import React from 'react';
import { View, Text, Modal } from 'react-native';

export const ProgressUpdateModal = ({ visible, onCancel }: any) => {
  return (
    <Modal visible={visible} onRequestClose={onCancel}>
      <View>
        <Text>ProgressUpdateModal</Text>
      </View>
    </Modal>
  );
};