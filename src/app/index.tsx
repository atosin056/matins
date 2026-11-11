import avatar from '@/assets/images/avatar.png';
import Flame from '@/assets/images/Flame.svg';
import DayPicker from '@/components/DayPicker';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{gap: 20}}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Image source={avatar} style={styles.avatar} />
          </View>
          <View style={styles.holder}>
            <Flame />
          </View>
        </View>
        <View>
          <Text style={styles.title}>Today's Journey</Text>
          <Text style={styles.subtitle}>Tailored just for you</Text>
        </View>
        <View>
          <View>
            <DayPicker onSelect={(date) => console.log(date)} />
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
  subtitle: {
    color: '#B7B6A6',
    fontFamily: 'SourceSerif',
    lineHeight: 25,
    fontSize: 15,
  },
  title: {
    fontFamily: 'SourceSerif',
    color: "#E8E4CE", 
    fontSize: 32,
    fontWeight: 500
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
