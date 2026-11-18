import { getSavedMovies } from '@services/saved'
import useFetch from '@services/useFetch'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import MovieCard from '../../../components/MovieCard'
import { icons } from '../../../constants/icons'
import { images } from '../../../constants/images'

const saved = () => {
  const router = useRouter()

  const { data: savedMovies, loading, error, refetch: loadSaved } = useFetch(getSavedMovies, false)

  // Reload every time this tab comes into view, so movies saved on the
  // details screen show up straight away
  useFocusEffect(
    useCallback(() => {
      loadSaved()
    }, [])
  )

  const isFirstLoad = loading && !savedMovies

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />
      <FlatList
        className="flex-1 px-5 mt-2"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 120 }}
        data={isFirstLoad || error ? [] : savedMovies ?? []}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: 'flex-start',
          gap: 20,
          paddingRight: 5,
          marginBottom: 10,
        }}
        renderItem={({ item }) => <MovieCard {...item} />}
        ListHeaderComponent={
          <>
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
            <View className="mt-5 mb-3 flex-row items-center justify-between">
              <Text className="text-lg text-white font-bold">Saved Movies</Text>
              {savedMovies && savedMovies.length > 0 ? (
                <Text className="text-light-300 text-sm">{savedMovies.length} saved</Text>
              ) : null}
            </View>
            {isFirstLoad ? (
              <ActivityIndicator size="large" color="#0000ff" className="mt-10 self-center" />
            ) : null}
            {error ? <Text className="text-red-500">Error: {error}</Text> : null}
          </>
        }
        ListEmptyComponent={
          !isFirstLoad && !error ? (
            <View className="items-center mt-16 px-5">
              <Image source={icons.save} className="size-10" tintColor="#A8B5DB" />
              <Text className="text-white font-bold text-base mt-4">No saved movies yet</Text>
              <Text className="text-light-300 text-sm text-center mt-2">
                Open any movie and tap the bookmark button to save it here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/')}
                className="mt-6 bg-accent rounded-full px-6 py-3"
              >
                <Text className="text-secondary font-semibold">Browse movies</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />
    </View>
  )
}

export default saved
