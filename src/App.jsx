import React, { useState, useEffect } from 'react'
import Search  from './components/search'
import Spinner from './components/spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY; 

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

// ALERTTTT => NEVER MUTATE THE STATE (searchTerm) EVER IN REACT.  WHATEVER YOU WANT TO CHANGE, CHANGE THROUGH SETTER FUNCTION(setSearchTerm).

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [trendingMovies, setTrendingMovies] = useState([]);

  // Debounces the search term to prevent making too many API requests
  // By waiting for user to stop typing for 500ms, and then sending the request
  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm)
  }, 500, [searchTerm])
 
  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const endPoint =  query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endPoint, API_OPTIONS);

      if(!response.ok){
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      
      if(data.response === 'False'){
        setErrorMsg(data.error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMsg('Error fetching movies, please try again later.') 
    } finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies); 

    } catch (error) {
      console.log(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  // [] -> empty dependency array means that only load this when the first time app loads. Then never.  

  useEffect(() => {
    loadTrendingMovies()
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero-img.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll enjoy without the hassle</h1>
        <Search searchTerm = {searchTerm} setSearchTerm = {setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>
          
          {isLoading ? (
            <Spinner/>
          ) : errorMsg ? (
            <p className="text-red-500">{errorMsg}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

         </section>
      </div>
    </main>
  )
}

export default App
