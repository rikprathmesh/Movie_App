import { fetchMovies } from '@services/api'
import { updateSearchCount } from '@services/trending'
import useFetch from '@services/useFetch'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native'
import MovieCard from '../../../components/MovieCard'
import SearchBar from '../../../components/SearchBar'
import { icons } from '../../../constants/icons'
import { images } from '../../../constants/images'

const search = () => {

  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
    refetch: loadMovies,
    reset
  } = useFetch(() => fetchMovies({
    query: searchQuery
  }), false)

  // Search whenever the text changes, waiting 500ms after the last keystroke
  // so we don't send a request for every single letter typed
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        await loadMovies()
      } else {
        reset()
      }
    }, 500)

    return () => clearTimeout(timeoutId)

  }, [searchQuery])

  // Once new results arrive, record the search in PostgreSQL (used for Trending Movies).
  // This runs after `movies` updates, so it always uses this search's results.
  useEffect(() => {
    if (searchQuery.trim() && movies && movies.length > 0) {
      updateSearchCount(searchQuery.trim(), movies[0]).catch(() => {
        // Already logged in updateSearchCount; don't break the search screen
      })
    }
  }, [movies])



  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="flex-1 absolute w-full z-0"
        resizeMode="cover"
      />
      <FlatList
        data={movies ?? []}
        renderItem={({ item }) => <MovieCard {...item} />}
        keyExtractor={(item) => item.id.toString()}
        className="flex-1 px-5 mt-2"
        showsVerticalScrollIndicator={false}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "center",
          gap: 16,
          marginVertical: 16
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
            <View className="mt-5 mb-5">
              <SearchBar
                value={searchQuery}
                onChangeText={(text: string) => setSearchQuery(text)}
                placeholder="Search movies..."
              />
            </View>
            {moviesLoading && (
              <ActivityIndicator
                size="large"
                color="#0000ff"
                className="my-3"
              />
            )}
            {moviesError && (
              <Text className="text-center text-red-500">Error fetching movies</Text>
            )}

            {!moviesLoading && !moviesError && !!searchQuery.trim() && !!movies && movies.length > 0 && (
              <Text className="text-xl text-white font-bold">Search Results For {' '}
                <Text className="text-accent">{searchQuery}</Text>
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          !moviesLoading && !moviesError && searchQuery.trim() ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : undefined
        }
      />
    </View>
  )
}

export default search