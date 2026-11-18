import { fetchMovieDetails } from '@services/api'
import { isMovieSaved, removeSavedMovie, saveMovie } from '@services/saved'
import useFetch from '@services/useFetch'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { icons } from '../../../constants/icons'

// One labelled block of information (Overview, Genres, ...)
const MovieInfo = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View className="flex-col items-start justify-center mt-5">
    <Text className="text-light-200 font-normal text-sm">{label}</Text>
    <Text className="text-light-100 font-bold text-sm mt-2">{value || 'N/A'}</Text>
  </View>
)

const formatMoney = (amount: number) =>
  amount > 0 ? `$${Math.round(amount / 1_000_000)} million` : 'N/A'

const MovieDetailsScreen = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const movieId = Number(id)

  const { data: movie, loading, error } = useFetch(() => fetchMovieDetails(id))

  // Bookmark state: null = still checking
  const [saved, setSaved] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    isMovieSaved(movieId)
      .then(setSaved)
      .catch(() => setSaved(false))
  }, [movieId])

  const toggleSaved = async () => {
    if (!movie || saved === null || saving) return
    const wasSaved = saved
    setSaved(!wasSaved) // update the icon straight away
    setSaving(true)
    try {
      if (wasSaved) {
        await removeSavedMovie(movie.id)
      } else {
        await saveMovie({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        })
      }
    } catch {
      setSaved(wasSaved) // put it back if the database call failed
    } finally {
      setSaving(false)
    }
  }

  if (loading || (!movie && !error)) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#AB8BFF" />
      </View>
    )
  }

  if (error || !movie) {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5">
        <Text className="text-red-500 text-center">Error: {error ?? 'Movie not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-5 bg-accent rounded-lg px-6 py-3">
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="bg-primary flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <Image
            source={{
              uri: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://placehold.co/500x750/1a1a1a/ffffff.png',
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />

          {/* Bookmark button on top of the poster */}
          <TouchableOpacity
            onPress={toggleSaved}
            disabled={saved === null || saving}
            className="absolute top-14 right-5 size-12 rounded-full bg-dark-200/80 justify-center items-center"
          >
            {saved === null ? (
              <ActivityIndicator size="small" color="#AB8BFF" />
            ) : (
              <Image source={icons.save} className="size-5" tintColor={saved ? '#AB8BFF' : '#FFFFFF'} />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{movie.title}</Text>

          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-light-200 text-sm">{movie.release_date?.split('-')[0]}</Text>
            {movie.runtime ? <Text className="text-light-200 text-sm">• {movie.runtime}m</Text> : null}
          </View>

          <View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" tintColor="#FFD700" />
            <Text className="text-white font-bold text-sm">{Math.round(movie.vote_average ?? 0)}/10</Text>
            <Text className="text-light-200 text-sm">({movie.vote_count} votes)</Text>
          </View>

          <MovieInfo label="Overview" value={movie.overview} />
          <MovieInfo label="Genres" value={movie.genres?.map((g) => g.name).join(' • ')} />

          <View className="flex-row justify-between w-1/2">
            <MovieInfo label="Budget" value={formatMoney(movie.budget)} />
            <MovieInfo label="Revenue" value={formatMoney(movie.revenue)} />
          </View>

          <MovieInfo
            label="Production Companies"
            value={movie.production_companies?.map((c) => c.name).join(' • ')}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex-row items-center justify-center z-50"
        onPress={() => router.back()}
      >
        <Image source={icons.arrow} className="size-5 mr-1 mt-0.5 rotate-180" tintColor="#fff" />
        <Text className="text-white font-semibold text-base">Go back</Text>
      </TouchableOpacity>
    </View>
  )
}

export default MovieDetailsScreen
