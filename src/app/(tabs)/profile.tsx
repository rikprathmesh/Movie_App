import { getProfile, pickAndUploadAvatar, removeAvatar, type PhotoSource } from '@services/profile'
import { getProfileStats } from '@services/saved'
import { getTrendingMovies } from '@services/trending'
import useFetch from '@services/useFetch'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { icons } from '../../../constants/icons'
import { images } from '../../../constants/images'

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <View className="flex-1 bg-dark-100 rounded-2xl py-4 items-center">
    <Text className="text-white text-2xl font-bold">{value}</Text>
    <Text className="text-light-300 text-xs mt-1">{label}</Text>
  </View>
)

const profile = () => {
  const router = useRouter()

  const { data: stats, loading: statsLoading, error: statsError, refetch: loadStats } =
    useFetch(getProfileStats, false)
  const { data: topSearches, refetch: loadTopSearches } = useFetch(getTrendingMovies, false)
  const { data: profileData, refetch: loadProfile } = useFetch(getProfile, false)

  // Photo shown on screen; updated straight away after an upload or removal
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined)
  const [photoBusy, setPhotoBusy] = useState(false)
  const shownAvatar = avatar !== undefined ? avatar : profileData?.avatar ?? null

  // Refresh whenever the tab comes into view, so the numbers are always current
  useFocusEffect(
    useCallback(() => {
      loadStats()
      loadTopSearches()
      loadProfile()
    }, [])
  )

  const changePhoto = async (source: PhotoSource) => {
    setPhotoBusy(true)
    try {
      const uploaded = await pickAndUploadAvatar(source)
      if (uploaded) setAvatar(uploaded)
    } catch (err) {
      Alert.alert('Could not update photo', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const deletePhoto = async () => {
    setPhotoBusy(true)
    try {
      await removeAvatar()
      setAvatar(null)
    } catch {
      Alert.alert('Could not remove photo', 'Please try again.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const openPhotoMenu = () => {
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose from gallery', onPress: () => changePhoto('library') },
      { text: 'Take photo', onPress: () => changePhoto('camera') },
      ...(shownAvatar
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: deletePhoto }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        {/* Avatar and name */}
        <View className="items-center mt-5">
          <TouchableOpacity onPress={openPhotoMenu} disabled={photoBusy} activeOpacity={0.8}>
            <View className="size-24 rounded-full bg-dark-100 border-2 border-accent justify-center items-center overflow-hidden">
              {shownAvatar ? (
                <Image source={{ uri: shownAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Image source={icons.person} className="size-10" tintColor="#AB8BFF" />
              )}
              {photoBusy ? (
                <View className="absolute inset-0 bg-black/50 justify-center items-center">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            {/* "+" badge showing the photo can be changed */}
            <View className="absolute bottom-0 right-0 size-7 rounded-full bg-accent border-2 border-primary justify-center items-center">
              <Text className="text-secondary font-bold text-base leading-5">+</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-light-300 text-xs mt-2">
            {shownAvatar ? 'Tap to change photo' : 'Tap to add a photo'}
          </Text>
          <Text className="text-white text-xl font-bold mt-3">Movie Fan</Text>
          <Text className="text-light-300 text-sm mt-1">Your movie activity</Text>
        </View>

        {/* Stats */}
        {statsLoading && !stats ? (
          <ActivityIndicator size="large" color="#0000ff" className="mt-10 self-center" />
        ) : statsError ? (
          <Text className="text-red-500 text-center mt-8">Error: {statsError}</Text>
        ) : stats ? (
          <View className="flex-row gap-x-3 mt-8">
            <StatCard label="Saved" value={stats.savedCount} />
            <StatCard label="Searches" value={stats.totalSearches} />
            <StatCard label="Unique" value={stats.uniqueSearches} />
          </View>
        ) : null}

        {/* Most searched */}
        <Text className="text-lg text-white font-bold mt-10 mb-3">Your Top Searches</Text>
        {topSearches && topSearches.length > 0 ? (
          topSearches.map((movie, index) => (
            <TouchableOpacity
              key={movie.movie_id}
              onPress={() => router.push({ pathname: '/movies/[id]', params: { id: movie.movie_id } })}
              className="flex-row items-center bg-dark-100 rounded-xl p-3 mb-3"
            >
              <Text className="text-accent font-bold text-lg w-7">{index + 1}</Text>
              <Image source={{ uri: movie.poster_url }} className="w-10 h-14 rounded-md" resizeMode="cover" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>{movie.title}</Text>
                <Text className="text-light-300 text-xs mt-1">
                  Searched {movie.count} {movie.count === 1 ? 'time' : 'times'}
                </Text>
              </View>
              <Image source={icons.arrow} className="size-4" tintColor="#A8B5DB" />
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-light-300 text-sm">Search for movies and your favourites will show up here.</Text>
        )}

        {/* Shortcuts */}
        <View className="flex-row gap-x-3 mt-6">
          <TouchableOpacity
            onPress={() => router.push('/saved')}
            className="flex-1 flex-row items-center justify-center bg-accent rounded-full py-3"
          >
            <Image source={icons.save} className="size-4 mr-2" tintColor="#151312" />
            <Text className="text-secondary font-semibold">Saved movies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            className="flex-1 flex-row items-center justify-center bg-dark-100 rounded-full py-3"
          >
            <Image source={icons.search} className="size-4 mr-2" tintColor="#FFFFFF" />
            <Text className="text-white font-semibold">Search</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default profile
