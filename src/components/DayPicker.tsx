import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ITEM_W = 58;
const GAP = 12;
const PAD = 18;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type Props = {
  daysBefore?: number;
  daysAfter?: number;
  onSelect?: (date: Date) => void;
};

export default function DayPicker({
  daysBefore = 7,
  daysAfter = 21,
  onSelect,
}: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(today);

  const days = useMemo(
    () =>
      Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i - daysBefore);
        return d;
      }),
    [today, daysBefore, daysAfter],
  );

  // Scroll so today sits in the middle on first render
  useEffect(() => {
    const x = PAD + daysBefore * (ITEM_W + GAP) + ITEM_W / 2 - width / 2;
    const id = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: false }),
    );
    return () => cancelAnimationFrame(id);
  }, [daysBefore, width]);

  const handlePress = (d: Date) => {
    setSelected(d);
    onSelect?.(d);
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((d) => {
        const active = sameDay(d, selected);
        return (
          <Pressable
            key={d.toISOString()}
            onPress={() => handlePress(d)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.letter, active && styles.letterActive]}>
              {LETTERS[d.getDay()]}
            </Text>
            <View style={[styles.circle, active && styles.circleActive]}>
              <Text style={[styles.num, active && styles.numActive]}>
                {d.getDate()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 0,
    gap: GAP,
  },
  pill: {
    width: ITEM_W,
    height: 112,
    borderRadius: ITEM_W / 2,
    backgroundColor: '#2A2C25',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 22,
    paddingBottom: 12,
  },
  pillActive: {
    backgroundColor: '#FFD966',
  },
  letter: {
    fontFamily: 'SourceSerif',
    fontSize: 22,
    color: '#E6E3D3',
  },
  letterActive: {
    color: '#2A2A1E',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3D33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: '#FFE59A',
  },
  num: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#E6E3D3',
  },
  numActive: {
    color: '#2A2A1E',
  },
});