import avatar from '@/assets/images/avatar.png';
import Flame from '@/assets/images/Flame.svg';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Image source={avatar} style={styles.avatar} />
          </View>
          <View style={styles.holder}>
            <Flame />
          </View>
        </View>
        <View>
          <Text>soin</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 50,
    backgroundColor: '#171A16',
    flex: 1
  },
  holder: {
    backgroundColor: '#30342C',
    borderRadius: 100,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30 
  }
});
