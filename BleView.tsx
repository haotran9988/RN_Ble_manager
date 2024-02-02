import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import BleManager from 'react-native-ble-manager';

interface Peripheral {
  id: string;
  name: string | null;
  connected: boolean;
}

const BleView = () => {
  const [devices, setDevices] = useState<Peripheral[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Peripheral | null>(null);
  
  useEffect(() => {
    BleManager.start({showAlert: false});

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(result => {
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          //
        }
      });
    }
    requestBluetoothScanPermission();
    const subscription = BleManager.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  //---------SCAN--Bluetooth---------------
  async function requestBluetoothScanPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Quyền Quét Bluetooth',
          message: 'Ứng dụng cần quyền quét các thiết bị Bluetooth',
          buttonNeutral: 'Hỏi Lại Sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'Đồng Ý',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Quyền quét Bluetooth đã được cấp');
      } else {
        console.log('Quyền quét Bluetooth bị từ chối');
      }
    }
  }
  const handleScanDevices = () => {
    BleManager.scan([], 5, true).then(() => {
      //
    });
  };

  //---------------------DISPLAY Device blueetooth---------------------
  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    if (!peripheral.name) {
      peripheral.name = 'Không tên';
    }
    setDevices(oldDevices => {
      const deviceExists = oldDevices.some(
        device => device.id === peripheral.id,
      );
      if (!deviceExists) {
        return [...oldDevices, peripheral];
      }
      return oldDevices;
    });
  };
  //---------------------------CONNECT------------------------------------
  const connectToDevice = (peripheral: Peripheral) => {
    BleManager.connect(peripheral.id)
      .then(() => {
        console.log(`Connected to ${peripheral.id}`);
        setConnectedDevice(peripheral);
        setDevices(prevDevices => prevDevices.map(device => {
          if (device.id === peripheral.id) {
            return { ...device, connected: true };
          }
          return device;
        }));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  //-------------------DISCONNECT-------------------------------------------
  const disconnectFromDevice = () => {
    if (connectedDevice) {
      BleManager.disconnect(connectedDevice.id)
        .then(() => {
          console.log(`Disconnected from ${connectedDevice.id}`);
          setConnectedDevice(null);
          setDevices(prevDevices => prevDevices.map(device => {
            if (device.id === connectedDevice.id) {
              return { ...device, connected: false };
            }
            return device;
          }));
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const renderItem = ({ item }: { item: Peripheral }) => (
    <TouchableOpacity
      style={styles.device}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
      {item.connected && <Text style={styles.connected}>Connected</Text>}
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handleScanDevices}>
        <Text style={styles.txt}>Scan</Text>
      </TouchableOpacity>
      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
       {connectedDevice && (
        <View style={styles.connectedPanel}>
          <Text style={styles.panelTitle}>Thiết Bị Đã Kết Nối</Text>
          <Text style={styles.deviceName}>{connectedDevice.name}</Text>
          <Text style={styles.deviceId}>{connectedDevice.id}</Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnectFromDevice}
          >
            <Text style={styles.disconnectButtonText}>Ngắt Kết Nối</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default BleView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  btn: {
    backgroundColor: 'blue',
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  txt: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  device: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 14,
    color: 'grey',
  },
  connectedPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: 'red',
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  disconnectButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  connected: {
    color: 'green',
    marginTop: 5,
  },
});
