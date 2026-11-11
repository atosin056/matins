import avatar from '@/assets/images/avatar.png';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View>
          <View>
            <Image source={avatar} style={styles.avatar} />
          </View>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30 
  }
});
