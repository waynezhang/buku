const { createApp, ref, reactive, computed, onMounted } = Vue;

// Utility functions
function formatDate(date) {
  if (date == null) {
    return "";
  }
  date = new Date(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function $json(url, method, data) {
  const resp = await fetch(url, {
    method: method || "GET",
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : null,
  });

  if (resp.status === 401) {
    // Redirect to login on authentication error
    if (window.location.pathname !== '/page/login') {
      router.push('/page/login');
    }
    throw Error('Authentication required');
  }

  if (!resp.ok) {
    const json = await resp.json();
    throw Error(json.message);
  }
  return await resp.json();
}

// Simple router
const router = {
  currentRoute: ref(window.location.pathname || '/page/home'),
  params: ref({}),

  push(path) {
    this.currentRoute.value = path.split('?')[0]; // Store path without query string
    window.history.pushState({}, '', path);
    this.parseParams();
  },

  parseParams() {
    const path = this.currentRoute.value;
    const params = {};

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams) {
      params[key] = value;
    }

    // Parse route parameters
    const segments = path.split('?')[0].split('/'); // Remove query string from path
    if (segments[1] === 'page') {
      if (segments[2] === 'book' && segments[3] && segments[4] !== 'edit' && segments[4] !== 'new') {
        params.id = segments[3];
      } else if (segments[2] === 'book' && segments[3] && segments[4] === 'edit') {
        params.id = segments[3];
      } else if (segments[2] === 'book' && segments[3] === 'year' && segments[4]) {
        params.year = segments[4];
      } else if (segments[2] === 'series' && segments[3]) {
        params.series = decodeURIComponent(segments[3]);
      } else if (segments[2] === 'author' && segments[3]) {
        params.author = decodeURIComponent(segments[3]);
      }
    }

    this.params.value = params;
  },

  init() {
    this.parseParams();
    window.addEventListener('popstate', () => {
      this.currentRoute.value = window.location.pathname;
      this.parseParams();
    });
  }
};

// Header Component
const Header = {
  props: ['currentPath', 'isAuthenticated'],
  setup(props) {
    const isMenuOpen = ref(false);

    const navigate = (path) => {
      router.push(path);
      isMenuOpen.value = false; // Close menu on navigation
    };

    const logout = async () => {
      try {
        await $json('/api/logout', 'POST');
        router.push('/page/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect to login even if logout fails
        router.push('/page/login');
      }
    };

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
    };

    return { navigate, logout, isMenuOpen, toggleMenu };
  },
  template: `
        <header class="mb-8">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-light">
                    <a href="#" @click.prevent="navigate('/page/home')" class="text-gray-900 hover:text-indigo-600">buku</a>
                </h1>
                <div class="flex items-center">
                    <button v-if="isAuthenticated" @click="logout" 
                            class="hidden md:block text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100">
                        Logout
                    </button>
                    <button @click="toggleMenu" class="md:hidden ml-4 text-gray-600 hover:text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <nav>
                <!-- Desktop Menu -->
                <div class="hidden md:flex space-x-8">
                    <a href="#" @click.prevent="navigate('/page/home')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/home' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"></path>
                       </svg>
                       Dashboard
                    </a>
                    <a href="#" @click.prevent="navigate('/page/books')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/books' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                       </svg>
                       Books
                    </a>
                    <a href="#" @click.prevent="navigate('/page/authors')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/authors' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                       </svg>
                       Authors
                    </a>
                    <a href="#" @click.prevent="navigate('/page/serieses')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/serieses' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                       </svg>
                       Series
                    </a>
                    <a href="#" @click.prevent="navigate('/page/admin')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath.startsWith('/page/admin') ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                       </svg>
                       Admin
                    </a>
                </div>
                <!-- Mobile Menu -->
                <div v-if="isMenuOpen" class="md:hidden mt-4">
                    <a href="#" @click.prevent="navigate('/page/home')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/home' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                       Dashboard
                    </a>
                    <a href="#" @click.prevent="navigate('/page/books')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/books' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                       Books
                    </a>
                    <a href="#" @click.prevent="navigate('/page/authors')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/authors' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                       Authors
                    </a>
                    <a href="#" @click.prevent="navigate('/page/serieses')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/serieses' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                       Series
                    </a>
                    <a href="#" @click.prevent="navigate('/page/admin')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath.startsWith('/page/admin') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                       Admin
                    </a>
                    <div v-if="isAuthenticated" class="border-t border-gray-200 mt-4 pt-4">
                        <button @click="logout" 
                                class="w-full text-left block py-2 px-3 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    `
};

// Footer Component
const Footer = {
  template: `
        <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>&copy; 2025 buku</p>
        </footer>
    `
};

// Home Component
const Home = {
  setup() {
    const homeData = ref(null);
    const loading = ref(true);
    const chartCanvas = ref(null);
    let chart = null;

    const fetchHomeData = async () => {
      try {
        loading.value = true;
        homeData.value = await $json('/api/home.json');
        // Create chart after data is loaded
        setTimeout(createChart, 100);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        loading.value = false;
      }
    };

    const createChart = () => {
      if (!homeData.value?.year_records || !chartCanvas.value) return;

      // Destroy existing chart if it exists
      if (chart) {
        chart.destroy();
      }

      const ctx = chartCanvas.value.getContext('2d');
      const yearRecords = homeData.value.year_records;

      // Sort by year
      yearRecords.sort((a, b) => a.year - b.year);

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: yearRecords.map(record => record.year.toString()),
          datasets: [{
            label: 'Books Read',
            data: yearRecords.map(record => record.count),
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 1,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                title: (context) => `Year ${context[0].label}`,
                label: (context) => `${context.parsed.y} books read`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#6B7280'
              },
              grid: {
                color: '#E5E7EB'
              }
            },
            x: {
              ticks: {
                color: '#6B7280'
              },
              grid: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          elements: {
            bar: {
              borderRadius: 4,
            }
          }
        }
      });
    };

    const navigate = (path) => {
      router.push(path);
    };

    onMounted(fetchHomeData);

    return { homeData, loading, formatDate, chartCanvas, navigate };
  },
  template: `
        <div v-if="loading" class="text-center py-8">Loading...</div>
        <div v-else-if="homeData && homeData.counts" class="space-y-8">
            <div>
                <h2 class="text-xl font-medium mb-4">Statistics</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div @click="navigate('/page/books?status=all')"
                         class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light">{{ homeData.counts.total || 0 }}</div>
                        <div class="text-sm text-gray-600">Total Books</div>
                    </div>
                    <div @click="navigate('/page/books?status=read')"
                         class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-green-600">{{ homeData.counts.read || 0 }}</div>
                        <div class="text-sm text-gray-600">Read</div>
                    </div>
                    <div @click="navigate('/page/books?status=reading')"
                         class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-indigo-600">{{ homeData.counts.reading || 0 }}</div>
                        <div class="text-sm text-gray-600">Reading</div>
                    </div>
                    <div @click="navigate('/page/books?status=to-read')"
                         class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-yellow-600">{{ homeData.counts.to_read || 0 }}</div>
                        <div class="text-sm text-gray-600">To Read</div>
                    </div>
                </div>
            </div>
            
            <div v-if="homeData.reading_books && homeData.reading_books.length > 0">
                <h2 class="text-xl font-medium mb-4">Currently Reading</h2>
                <div class="space-y-3">
                    <div v-for="book in homeData.reading_books" :key="book.id" 
                         class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                         @click="navigate('/page/book/' + book.id)">
                        <h3 class="font-normal">{{ book.title }}</h3>
                        <p class="text-sm text-gray-600">{{ book.author }}</p>
                        <p class="text-xs text-gray-500">Started: {{ formatDate(book.started_at) }}</p>
                    </div>
                </div>
            </div>
            
            <div v-if="homeData.year_records && homeData.year_records.length > 0">
                <h2 class="text-xl font-medium mb-4">Reading by Year</h2>
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="h-64 w-full">
                        <canvas ref="chartCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
            No data available
        </div>
    `
};

// Books List Component
const BooksList = {
  props: ['status'],
  setup(props) {
    const books = ref([]);
    const loading = ref(true);
    const currentStatus = ref(props.status || 'to-read');

    const fetchBooks = async (status = null) => {
      try {
        loading.value = true;
        const statusToUse = status || currentStatus.value;
        const url = (statusToUse && statusToUse !== 'all') ? `/api/books/${statusToUse}.json` : '/api/books.json';
        books.value = await $json(url);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    const changeStatus = (newStatus) => {
      currentStatus.value = newStatus;
      fetchBooks(newStatus);
    };

    const getStatusLabel = (status) => {
      if (!status || status === 'all') return 'All Books';
      if (status === 'to-read') return 'To Read';
      if (status === 'reading') return 'Currently Reading';
      if (status === 'read') return 'Read';
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    onMounted(() => fetchBooks());

    return { books, loading, formatDate, navigate, currentStatus, changeStatus, getStatusLabel };
  },
  template: `
        <div>
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-medium">{{ getStatusLabel(currentStatus) }}</h2>
                <button @click="navigate('/page/book/new')" 
                        class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add
                </button>
            </div>
            
            <!-- Status Filter -->
            <div class="mb-6">
                <div class="flex space-x-2">
                    <button @click="changeStatus('to-read')" 
                            class="px-3 py-1.5 rounded-md text-sm transition-colors"
                            :class="currentStatus === 'to-read' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                        📚 To Read
                    </button>
                    <button @click="changeStatus('reading')" 
                            class="px-3 py-1.5 rounded-md text-sm transition-colors"
                            :class="currentStatus === 'reading' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                        📖 Reading
                    </button>
                    <button @click="changeStatus('read')" 
                            class="px-3 py-1.5 rounded-md text-sm transition-colors"
                            :class="currentStatus === 'read' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                        ✅ Read
                    </button>
                    <button @click="changeStatus('all')" 
                            class="px-3 py-1.5 rounded-md text-sm transition-colors"
                            :class="currentStatus === 'all' ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                        📋 All Books
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500">
                No books found
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate(\`/page/book/\${book.id}\`)">
                    <h3 class="font-normal">{{ book.title }}</h3>
                    <p class="text-sm text-gray-600">{{ book.author }}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs px-2 py-1 rounded" 
                              :class="{
                                  'bg-green-100 text-green-800': book.status === 'read',
                                  'bg-blue-100 text-blue-800': book.status === 'reading',
                                  'bg-yellow-100 text-yellow-800': book.status === 'to-read'
                              }">
                            {{ book.status.replace('-', ' ') }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatDate(book.finished_at || book.started_at) }}</span>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Book View Component
const BookView = {
  props: ['bookId'],
  setup(props) {
    const book = ref(null);
    const loading = ref(true);

    const fetchBook = async () => {
      try {
        loading.value = true;
        book.value = await $json(`/api/book/${props.bookId}.json`);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    const changeStatus = async (newStatus) => {
      try {
        await $json(`/api/book/${props.bookId}/status.json`, 'POST', { status: newStatus });
        await fetchBook(); // Refresh book data
      } catch (error) {
        console.error('Error changing status:', error);
      }
    };

    const deleteBook = async () => {
      if (confirm('Are you sure you want to delete this book?')) {
        try {
          await $json(`/api/book/${props.bookId}.json`, 'DELETE');
          router.push('/page/books');
        } catch (error) {
          console.error('Error deleting book:', error);
        }
      }
    };

    onMounted(fetchBook);

    return { book, loading, formatDate, navigate, changeStatus, deleteBook };
  },
  template: `
        <div v-if="loading" class="text-center py-8">Loading...</div>
        <div v-else-if="book" class="space-y-6">
            <!-- Header Section with Book Info -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-8 rounded-xl shadow-sm">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div class="flex-1 mb-4 md:mb-0">
                        <div class="mb-3">
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                                  :class="{
                                      'bg-green-100 text-green-800': book.status === 'read',
                                      'bg-blue-100 text-blue-800': book.status === 'reading',
                                      'bg-yellow-100 text-yellow-800': book.status === 'to-read'
                                  }">
                                {{ book.status.replace('-', ' ').toUpperCase() }}
                            </span>
                        </div>
                        <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                            <div>
                                <h1 class="text-2xl md:text-3xl font-light text-gray-900 mb-2">{{ book.title }}</h1>
                                <p class="text-lg md:text-xl text-gray-600 mb-3">by {{ book.author }}</p>
                            </div>
                            <div class="flex space-x-2 mt-4 md:flex-col md:space-y-2 md:space-x-0 md:mt-0 md:ml-4">
                                <button @click="navigate('/page/book/' + book.id + '/edit')" 
                                        class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors flex items-center text-sm">
                                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Edit
                                </button>
                                <button @click="deleteBook" 
                                        class="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm">
                                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div v-if="book.series" class="flex items-center text-gray-500 mt-3">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <span class="text-sm">{{ book.series }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reading Progress Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Reading Status
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-gray-600 mb-2 block">Current Status</label>
                            <select v-model="book.status" @change="changeStatus(book.status)" 
                                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="to-read">📚 To Read</option>
                                <option value="reading">📖 Currently Reading</option>
                                <option value="read">✅ Finished</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Timeline
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-gray-600">Started</span>
                            <span class="text-sm font-medium" :class="book.started_at ? 'text-gray-900' : 'text-gray-400'">
                                {{ formatDate(book.started_at) || 'Not started' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-gray-600">Finished</span>
                            <span class="text-sm font-medium" :class="book.finished_at ? 'text-gray-900' : 'text-gray-400'">
                                {{ formatDate(book.finished_at) || 'Not finished' }}
                            </span>
                        </div>
                        <div v-if="book.started_at && book.finished_at" class="flex items-center justify-between py-2 border-t pt-3">
                            <span class="text-sm text-gray-600">Reading time</span>
                            <span class="text-sm font-medium text-indigo-600">
                                {{ Math.ceil((new Date(book.finished_at) - new Date(book.started_at)) / (1000 * 60 * 60 * 24)) }} days
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Book Details Section -->
            <div class="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Book Details
                </h3>
                <div class="space-y-4">
                    <div v-if="book.isbn">
                        <label class="text-sm font-medium text-gray-600">ISBN</label>
                        <p class="mt-1 text-gray-900 font-mono text-sm">{{ book.isbn }}</p>
                    </div>
                    <div v-if="book.comments">
                        <label class="text-sm font-medium text-gray-600">Comments</label>
                        <div class="mt-2 bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-200">
                            <p class="text-gray-800 leading-relaxed whitespace-pre-line">{{ book.comments }}</p>
                        </div>
                    </div>
                    <div v-if="!book.isbn && !book.comments" class="text-center py-4 text-gray-500">
                        No additional details available
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Quick Actions
                </h3>
                <div class="flex flex-wrap gap-2">
                    <button v-if="book.status === 'to-read'" @click="changeStatus('reading')"
                            class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        📖 Start Reading
                    </button>
                    <button v-if="book.status === 'reading'" @click="changeStatus('read')"
                            class="bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-200 transition-colors text-sm">
                        ✅ Mark as Finished
                    </button>
                    <button v-if="book.author" @click="navigate('/page/author/' + encodeURIComponent(book.author))"
                            class="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm">
                        👤 View Author's Books
                    </button>
                    <button v-if="book.series" @click="navigate('/page/series/' + encodeURIComponent(book.series))"
                            class="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-200 transition-colors text-sm">
                        📚 View Series Books
                    </button>
                </div>
            </div>
        </div>
    `
};

// Book Edit Component
const BookEdit = {
  props: ['bookId'],
  setup(props) {
    const book = reactive({
      title: '',
      author: '',
      series: '',
      isbn: '',
      status: 'to-read',
      started_at: '',
      finished_at: '',
      comments: ''
    });
    const loading = ref(true);
    const saving = ref(false);
    const searching = ref(false);
    const searchResults = ref([]);
    const showSearchResults = ref(false);
    const lastSearchQuery = ref('');
    const authors = ref([]);
    const series = ref([]);
    const filteredAuthors = ref([]);
    const filteredSeries = ref([]);
    const showAuthorDropdown = ref(false);
    const showSeriesDropdown = ref(false);

    const fetchBook = async () => {
      if (props.bookId) {
        try {
          const data = await $json(`/api/book/${props.bookId}.json`);
          Object.assign(book, {
            ...data,
            started_at: data.started_at ? formatDate(data.started_at) : '',
            finished_at: data.finished_at ? formatDate(data.finished_at) : ''
          });
        } catch (error) {
          console.error('Error fetching book:', error);
        }
      }
      loading.value = false;
    };

    const fetchAuthorsAndSeries = async () => {
      try {
        const [authorsData, seriesData] = await Promise.all([
          $json('/api/authors.json'),
          $json('/api/series.json')
        ]);
        authors.value = authorsData.map(a => a.name);
        series.value = seriesData.map(s => s.name);
      } catch (error) {
        console.error('Error fetching authors and series:', error);
      }
    };

    const filterAuthors = (query) => {
      if (!query) {
        filteredAuthors.value = [];
        showAuthorDropdown.value = false;
        return;
      }
      filteredAuthors.value = authors.value
        .filter(author => author.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      showAuthorDropdown.value = filteredAuthors.value.length > 0;
    };

    const filterSeries = (query) => {
      if (!query) {
        filteredSeries.value = [];
        showSeriesDropdown.value = false;
        return;
      }
      filteredSeries.value = series.value
        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      showSeriesDropdown.value = filteredSeries.value.length > 0;
    };

    const selectAuthor = (author) => {
      book.author = author;
      showAuthorDropdown.value = false;
    };

    const selectSeries = (selectedSeries) => {
      book.series = selectedSeries;
      showSeriesDropdown.value = false;
    };

    const onAuthorInput = (event) => {
      book.author = event.target.value;
      filterAuthors(book.author);
    };

    const onSeriesInput = (event) => {
      book.series = event.target.value;
      filterSeries(book.series);
    };

    const saveBook = async () => {
      try {
        saving.value = true;
        const url = props.bookId ? `/api/book/${props.bookId}.json` : '/api/book.json';
        const method = props.bookId ? 'POST' : 'POST';

        const bookData = { ...book };
        // Ensure dates are strings (empty string if not set)
        bookData.started_at = bookData.started_at || '';
        bookData.finished_at = bookData.finished_at || '';

        const result = await $json(url, method, bookData);
        router.push(props.bookId ? `/page/book/${props.bookId}` : `/page/book/${result.id}`);
      } catch (error) {
        console.error('Error saving book:', error);
        alert('Error saving book: ' + error.message);
      } finally {
        saving.value = false;
      }
    };

    const searchGoogleBooks = async () => {
      if (!book.title) {
        alert('Please enter a book title first');
        return;
      }
      try {
        searching.value = true;

        // Build advanced search query
        let searchQuery = '';
        if (book.title) {
          searchQuery += `intitle:"${book.title}"`;
        }
        if (book.author) {
          searchQuery += ` inauthor:"${book.author}"`;
        }

        // If no advanced query built, fallback to simple title search
        if (!searchQuery) {
          searchQuery = book.title;
        }

        lastSearchQuery.value = searchQuery;
        const results = await $json(`/api/google_book_search.json?query=${encodeURIComponent(searchQuery)}`);
        searchResults.value = results;
        showSearchResults.value = results.length > 0;
        if (results.length === 0) {
          alert('No books found on Google Books. Try adjusting your search terms.');
        }
      } catch (error) {
        console.error('Error searching Google Books:', error);
        alert('Error searching Google Books: ' + error.message);
      } finally {
        searching.value = false;
      }
    };

    const selectGoogleBook = (selected) => {
      book.title = selected.title || book.title;
      book.author = selected.author || book.author;
      book.isbn = selected.isbn || book.isbn;
      showSearchResults.value = false;
    };

    const closeSearchResults = () => {
      showSearchResults.value = false;
    };

    onMounted(() => {
      fetchBook();
      fetchAuthorsAndSeries();
    });

    return {
      book, loading, saving, saveBook, searchGoogleBooks, router,
      searching, searchResults, showSearchResults, lastSearchQuery, selectGoogleBook, closeSearchResults,
      filteredAuthors, filteredSeries, showAuthorDropdown, showSeriesDropdown,
      selectAuthor, selectSeries, onAuthorInput, onSeriesInput
    };
  },
  template: `
        <div v-if="loading" class="text-center py-8">Loading...</div>
        <div v-else class="space-y-6">
            <h2 class="text-xl font-medium">{{ bookId ? 'Edit Book' : 'Add New Book' }}</h2>
            
            <form @submit.prevent="saveBook" class="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div class="flex space-x-2">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-600">Title</label>
                        <input v-model="book.title" type="text" required
                               class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <button type="button" @click="searchGoogleBooks" :disabled="searching"
                            class="mt-6 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-1">
                        <svg v-if="!searching" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <svg v-if="searching" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        {{ searching ? 'Searching...' : 'Search' }}
                    </button>
                    
                    <!-- Google Books Search Results Modal -->
                    <div v-if="showSearchResults" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div class="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <h3 class="text-lg font-medium">Select a Book</h3>
                                    <p class="text-xs text-gray-500 mt-1">Searched: {{ lastSearchQuery }}</p>
                                </div>
                                <button @click="closeSearchResults" class="text-gray-500 hover:text-gray-700">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div v-for="result in searchResults" :key="result.id" 
                                     @click="selectGoogleBook(result)"
                                     class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <h4 class="font-medium text-gray-900">{{ result.title }}</h4>
                                    <p v-if="result.author" class="text-sm text-gray-600 mt-1">by {{ result.author }}</p>
                                    <p v-if="result.isbn" class="text-xs text-gray-500 mt-1">ISBN: {{ result.isbn }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="relative">
                    <label class="block text-sm font-medium text-gray-600">Author</label>
                    <input :value="book.author" @input="onAuthorInput" type="text" required
                           @focus="filterAuthors(book.author)"
                           @blur="setTimeout(() => showAuthorDropdown = false, 150)"
                           class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    <div v-if="showAuthorDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <button v-for="author in filteredAuthors" :key="author" @click="selectAuthor(author)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none text-sm">
                            {{ author }}
                        </button>
                    </div>
                </div>
                
                <div class="relative">
                    <label class="block text-sm font-medium text-gray-600">Series</label>
                    <input :value="book.series" @input="onSeriesInput" type="text"
                           @focus="filterSeries(book.series)"
                           @blur="setTimeout(() => showSeriesDropdown = false, 150)"
                           class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    <div v-if="showSeriesDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <button v-for="s in filteredSeries" :key="s" @click="selectSeries(s)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none text-sm">
                            {{ s }}
                        </button>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-600">Status</label>
                    <select v-model="book.status" class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                        <option value="to-read">To Read</option>
                        <option value="reading">Reading</option>
                        <option value="read">Read</option>
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Started Date</label>
                        <input v-model="book.started_at" type="date"
                               class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Finished Date</label>
                        <input v-model="book.finished_at" type="date"
                               class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-600">ISBN</label>
                    <input v-model="book.isbn" type="text"
                           class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-600">Comments</label>
                    <textarea v-model="book.comments" rows="4"
                              class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"></textarea>
                </div>
                
                <div class="flex justify-between">
                    <button type="button" @click="router.push('/page/books')"
                            class="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm">
                        Cancel
                    </button>
                    <button type="submit" :disabled="saving"
                            class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                        {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </form>
        </div>
    `
};

// Authors Component
const Authors = {
  setup() {
    const authors = ref([]);
    const loading = ref(true);

    const fetchAuthors = async () => {
      try {
        loading.value = true;
        authors.value = await $json('/api/authors.json');
      } catch (error) {
        console.error('Error fetching authors:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    onMounted(fetchAuthors);

    return { authors, loading, navigate };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-xl font-medium">Authors</h2>
                <div class="text-sm text-gray-500">
                    {{ authors.length }} authors
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="authors.length === 0" class="text-center py-8 text-gray-500">
                No authors found
            </div>
            <div v-else class="space-y-3">
                <div v-for="author in authors" :key="author.name" 
                     class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-200 hover:border-indigo-400"
                     @click="navigate('/page/author/' + encodeURIComponent(author.name))">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900">{{ author.name }}</h3>
                                <p class="text-sm text-gray-600">{{ author.count }} {{ author.count === 1 ? 'book' : 'books' }}</p>
                            </div>
                        </div>
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Series Component
const Series = {
  setup() {
    const series = ref([]);
    const loading = ref(true);

    const fetchSeries = async () => {
      try {
        loading.value = true;
        series.value = await $json('/api/series.json');
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    onMounted(fetchSeries);

    return { series, loading, navigate };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-xl font-medium">Series</h2>
                <div class="text-sm text-gray-500">
                    {{ series.length }} series
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="series.length === 0" class="text-center py-8 text-gray-500">
                No series found
            </div>
            <div v-else class="space-y-3">
                <div v-for="s in series" :key="s.name" 
                     class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-200 hover:border-indigo-400"
                     @click="navigate('/page/series/' + encodeURIComponent(s.name))">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900">{{ s.name }}</h3>
                                <p class="text-sm text-gray-600">{{ s.count }} {{ s.count === 1 ? 'book' : 'books' }}</p>
                            </div>
                        </div>
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Admin Component
const Admin = {
  setup() {
    const navigate = (path) => {
      router.push(path);
    };

    const deleteAll = async () => {
      if (confirm('Are you sure you want to delete all books? This cannot be undone.')) {
        try {
          await $json('/api/delete_all.json', 'POST');
          alert('All books have been deleted');
        } catch (error) {
          console.error('Error deleting all books:', error);
          alert('Error: ' + error.message);
        }
      }
    };

    const exportData = () => {
      window.open('/api/export', '_blank');
    };

    return { navigate, deleteAll, exportData };
  },
  template: `
        <div class="space-y-6">
            <h2 class="text-xl font-medium">Admin</h2>
            
            <div class="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div>
                    <h3 class="font-normal mb-2">Import Data</h3>
                    <button @click="navigate('/page/admin/import')"
                            class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm">
                        Import from CSV
                    </button>
                </div>
                
                <div>
                    <h3 class="font-normal mb-2">Export Data</h3>
                    <button @click="exportData"
                            class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm">
                        Export to CSV
                    </button>
                </div>
                
                <div>
                    <h3 class="font-normal mb-2 text-red-600">Danger Zone</h3>
                    <button @click="deleteAll"
                            class="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-sm">
                        Delete All Books
                    </button>
                </div>
            </div>
        </div>
    `
};

// Import Component
const Import = {
  setup() {
    const file = ref(null);
    const csvData = ref(null);
    const importing = ref(false);
    const step = ref(1); // 1: Select file, 2: Map columns
    const columnMapping = ref({
      Title: '-',
      Author: '-',
      Series: '-',
      ISBN: '-',
      Comments: '-',
      Started: '-',
      Finished: '-'
    });

    const handleFileChange = async (event) => {
      const selectedFile = event.target.files[0];
      if (!selectedFile) return;

      file.value = selectedFile;
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('/api/import/read_columns', {
          method: 'POST',
          body: formData
        });
        csvData.value = await response.json();
        step.value = 2; // Move to mapping step
      } catch (error) {
        console.error('Error reading columns:', error);
        alert('Error reading CSV file: ' + error.message);
      }
    };

    const goBack = () => {
      step.value = 1;
      file.value = null;
      csvData.value = null;
      // Reset mappings
      Object.keys(columnMapping.value).forEach(key => {
        columnMapping.value[key] = '-';
      });
    };

    const importData = async () => {
      if (!file.value) return;

      const formData = new FormData();
      formData.append('file', file.value);

      // Add column mappings to form data
      Object.keys(columnMapping.value).forEach(field => {
        formData.append(field, columnMapping.value[field]);
      });

      try {
        importing.value = true;
        const response = await fetch('/api/import', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (result.ok === false) {
          alert('Import failed: ' + result.message);
        } else {
          alert(`Import completed! Total: ${result.total}, Succeeded: ${result.succeeded}, Failed: ${result.failed}`);
          router.push('/page/admin');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error: ' + error.message);
      } finally {
        importing.value = false;
      }
    };

    return {
      file, csvData, importing, step, columnMapping,
      handleFileChange, goBack, importData, router
    };
  },
  template: `
        <div class="space-y-6">
            <h2 class="text-xl font-medium">Import Data</h2>
            
            <!-- Step 1: Select File -->
            <div v-if="step === 1" class="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600 mb-2">Select CSV File</label>
                    <input type="file" accept=".csv" @change="handleFileChange"
                           class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                </div>
                
                <div class="flex justify-start">
                    <button @click="router.push('/page/admin')"
                            class="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm">
                        Cancel
                    </button>
                </div>
            </div>
            
            <!-- Step 2: Map Columns -->
            <div v-if="step === 2" class="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div>
                    <h3 class="font-medium mb-4">Map CSV Columns to Book Fields</h3>
                    <div class="space-y-3">
                        <div v-for="field in Object.keys(columnMapping)" :key="field" 
                             class="flex items-center justify-between">
                            <label class="text-sm font-medium text-gray-600 w-24">{{ field }}:</label>
                            <select v-model="columnMapping[field]" 
                                    class="flex-1 ml-4 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option v-for="column in csvData.columns" :key="column" :value="column">
                                    {{ column === '-' ? '(Skip this field)' : column }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div v-if="csvData && csvData.columns">
                    <h4 class="text-sm font-medium text-gray-600 mb-2">Available CSV Columns:</h4>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="column in csvData.columns.slice(1)" :key="column" 
                              class="px-2 py-1 bg-gray-100 rounded text-xs">
                            {{ column }}
                        </span>
                    </div>
                </div>
                
                <div class="flex justify-between">
                    <button @click="goBack"
                            class="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm">
                        Back
                    </button>
                    <button @click="importData" :disabled="importing"
                            class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                        {{ importing ? 'Importing...' : 'Import Data' }}
                    </button>
                </div>
            </div>
        </div>
    `
};

// Author Books Component
const AuthorBooks = {
  props: ['author'],
  setup(props) {
    const books = ref([]);
    const loading = ref(true);
    const showRenameModal = ref(false);
    const newAuthorName = ref('');
    const renaming = ref(false);

    const fetchAuthorBooks = async () => {
      try {
        loading.value = true;
        books.value = await $json(`/api/books/author/${encodeURIComponent(props.author)}.json`);
      } catch (error) {
        console.error('Error fetching author books:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    const openRenameModal = () => {
      newAuthorName.value = props.author;
      showRenameModal.value = true;
      // Focus the input after modal is shown
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]');
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    };

    const closeRenameModal = () => {
      showRenameModal.value = false;
      newAuthorName.value = '';
    };

    const renameAuthor = async () => {
      if (!newAuthorName.value.trim() || newAuthorName.value.trim() === props.author) {
        closeRenameModal();
        return;
      }

      try {
        renaming.value = true;
        await $json(`/api/author/${encodeURIComponent(props.author)}.json`, 'POST', {
          name: newAuthorName.value.trim()
        });

        // Navigate to the new author page
        router.push(`/page/author/${encodeURIComponent(newAuthorName.value.trim())}`);
        closeRenameModal();
      } catch (error) {
        console.error('Error renaming author:', error);
        alert('Failed to rename author: ' + (error.message || 'Unknown error'));
        renaming.value = false; // Keep modal open on error
      }
    };

    onMounted(fetchAuthorBooks);

    return {
      books, loading, navigate, formatDate,
      showRenameModal, newAuthorName, renaming,
      openRenameModal, closeRenameModal, renameAuthor
    };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <button @click="navigate('/page/authors')" 
                            class="text-indigo-600 hover:text-indigo-800 mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h2 class="text-xl font-medium">Books by {{ author }}</h2>
                </div>
                <button @click="openRenameModal"
                        class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm flex items-center">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Rename
                </button>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500">
                No books found by this author
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate('/page/book/' + book.id)">
                    <h3 class="font-normal">{{ book.title }}</h3>
                    <p v-if="book.series" class="text-sm text-gray-500 mt-1">{{ book.series }}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs px-2 py-1 rounded" 
                              :class="{
                                  'bg-green-100 text-green-800': book.status === 'read',
                                  'bg-blue-100 text-blue-800': book.status === 'reading',
                                  'bg-yellow-100 text-yellow-800': book.status === 'to-read'
                              }">
                            {{ book.status.replace('-', ' ') }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatDate(book.finished_at || book.started_at) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Rename Modal -->
            <div v-if="showRenameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeRenameModal">
                <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4" @click.stop>
                    <h3 class="text-lg font-medium mb-4">Rename Author</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-600 mb-2">Author Name</label>
                        <input v-model="newAuthorName" type="text" 
                               @keyup.enter="renameAuthor"
                               @keyup.escape="closeRenameModal"
                               class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    </div>
                    <div class="flex justify-between">
                        <button @click="closeRenameModal"
                                class="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm">
                            Cancel
                        </button>
                        <button @click="renameAuthor" :disabled="renaming"
                                class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                            {{ renaming ? 'Renaming...' : 'Rename' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Series Books Component
const SeriesBooks = {
  props: ['series'],
  setup(props) {
    const books = ref([]);
    const loading = ref(true);
    const showRenameModal = ref(false);
    const newSeriesName = ref('');
    const renaming = ref(false);

    const fetchSeriesBooks = async () => {
      try {
        loading.value = true;
        books.value = await $json(`/api/books/series/${encodeURIComponent(props.series)}.json`);
      } catch (error) {
        console.error('Error fetching series books:', error);
      } finally {
        loading.value = false;
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    const openRenameModal = () => {
      newSeriesName.value = props.series;
      showRenameModal.value = true;
      // Focus the input after modal is shown
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="text"]');
        const seriesInput = inputs[inputs.length - 1]; // Get the last input (series modal)
        if (seriesInput) {
          seriesInput.focus();
          seriesInput.select();
        }
      }, 100);
    };

    const closeRenameModal = () => {
      showRenameModal.value = false;
      newSeriesName.value = '';
    };

    const renameSeries = async () => {
      if (!newSeriesName.value.trim() || newSeriesName.value.trim() === props.series) {
        closeRenameModal();
        return;
      }

      try {
        renaming.value = true;
        await $json(`/api/series/${encodeURIComponent(props.series)}.json`, 'POST', {
          name: newSeriesName.value.trim()
        });

        // Navigate to the new series page
        router.push(`/page/series/${encodeURIComponent(newSeriesName.value.trim())}`);
        closeRenameModal();
      } catch (error) {
        console.error('Error renaming series:', error);
        alert('Failed to rename series: ' + (error.message || 'Unknown error'));
        renaming.value = false; // Keep modal open on error
      }
    };

    onMounted(fetchSeriesBooks);

    return {
      books, loading, navigate, formatDate,
      showRenameModal, newSeriesName, renaming,
      openRenameModal, closeRenameModal, renameSeries
    };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <button @click="navigate('/page/serieses')" 
                            class="text-indigo-600 hover:text-indigo-800 mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h2 class="text-xl font-medium">{{ series }} Series</h2>
                </div>
                <button @click="openRenameModal"
                        class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm flex items-center">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Rename
                </button>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500">
                No books found in this series
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate('/page/book/' + book.id)">
                    <h3 class="font-normal">{{ book.title }}</h3>
                    <p class="text-sm text-gray-600">{{ book.author }}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs px-2 py-1 rounded" 
                              :class="{
                                  'bg-green-100 text-green-800': book.status === 'read',
                                  'bg-blue-100 text-blue-800': book.status === 'reading',
                                  'bg-yellow-100 text-yellow-800': book.status === 'to-read'
                              }">
                            {{ book.status.replace('-', ' ') }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatDate(book.finished_at || book.started_at) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Rename Modal -->
            <div v-if="showRenameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeRenameModal">
                <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4" @click.stop>
                    <h3 class="text-lg font-medium mb-4">Rename Series</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-600 mb-2">Series Name</label>
                        <input v-model="newSeriesName" type="text" 
                               @keyup.enter="renameSeries"
                               @keyup.escape="closeRenameModal"
                               class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    </div>
                    <div class="flex justify-between">
                        <button @click="closeRenameModal"
                                class="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm">
                            Cancel
                        </button>
                        <button @click="renameSeries" :disabled="renaming"
                                class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                            {{ renaming ? 'Renaming...' : 'Rename' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Login Component
const Login = {
  setup() {
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const login = async () => {
      if (!username.value || !password.value) {
        error.value = 'Please enter username and password';
        return;
      }

      try {
        loading.value = true;
        error.value = '';

        const result = await $json('/api/login', 'POST', {
          username: username.value,
          password: password.value
        });

        if (result.ok) {
          // Refresh authentication state
          if (window.refreshAuth) {
            await window.refreshAuth();
          }
          router.push('/page/home');
        } else {
          error.value = result.message || 'Login failed';
        }
      } catch (err) {
        error.value = err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      login();
    };

    return { username, password, loading, error, login, handleSubmit };
  },
  template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-medium text-gray-900">
                        Sign in to buku
                    </h2>
                </div>
                <form @submit="handleSubmit" class="mt-8 space-y-6">
                    <div class="space-y-4">
                        <div>
                            <label for="username" class="block text-sm font-medium text-gray-600">Username</label>
                            <input v-model="username" id="username" type="text" required
                                   class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-600">Password</label>
                            <input v-model="password" id="password" type="password" required
                                   class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                    </div>

                    <div v-if="error" class="text-red-600 text-sm text-center">
                        {{ error }}
                    </div>

                    <div>
                        <button type="submit" :disabled="loading"
                                class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium">
                            {{ loading ? 'Signing in...' : 'Sign in' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `
};

// Main App
const App = {
  components: {
    Header,
    Footer,
    Home,
    BooksList,
    BookView,
    BookEdit,
    Authors,
    AuthorBooks,
    Series,
    SeriesBooks,
    Admin,
    Import,
    Login
  },
  setup() {
    router.init();

    const currentRoute = router.currentRoute;
    const routeParams = router.params;
    const isAuthenticated = ref(false);
    const isCheckingAuth = ref(true);

    // Check authentication status
    const checkAuth = async () => {
      try {
        const result = await $json('/api/auth/check');
        isAuthenticated.value = result.authenticated;
        if (!result.authenticated && currentRoute.value !== '/page/login') {
          router.push('/page/login');
        } else if (result.authenticated && currentRoute.value === '/page/login') {
          router.push('/page/home');
        }
      } catch (error) {
        isAuthenticated.value = false;
        if (currentRoute.value !== '/page/login') {
          router.push('/page/login');
        }
      } finally {
        isCheckingAuth.value = false;
      }
    };

    // Make checkAuth available globally for login component
    window.refreshAuth = checkAuth;

    // Check auth on mount and when route changes
    onMounted(checkAuth);

    const currentComponent = computed(() => {
      const path = currentRoute.value;
      if (path === '/page/login') return 'Login';
      if (!isAuthenticated.value) return 'Login';

      if (path === '/page/home' || path === '/') return 'Home';
      if (path === '/page/books') return 'BooksList';
      if (path === '/page/backlog') return 'BooksList';
      if (path === '/page/book/new') return 'BookEdit';
      if (path.startsWith('/page/book/') && path.endsWith('/edit')) return 'BookEdit';
      if (path.startsWith('/page/book/')) return 'BookView';
      if (path === '/page/authors') return 'Authors';
      if (path.startsWith('/page/author/')) return 'AuthorBooks';
      if (path === '/page/serieses') return 'Series';
      if (path.startsWith('/page/series/')) return 'SeriesBooks';
      if (path === '/page/admin') return 'Admin';
      if (path === '/page/admin/import') return 'Import';
      return 'Home';
    });

    const componentProps = computed(() => {
      const path = currentRoute.value;
      const params = routeParams.value;

      if (path === '/page/books') return { status: params.status || 'to-read' };
      if (path === '/page/backlog') return { status: 'to-read' };
      if (path === '/page/book/new') return {}; // For new book, don't pass bookId
      if (path.startsWith('/page/book/') && path.endsWith('/edit')) return { bookId: params.id };
      if (path.startsWith('/page/book/')) return { bookId: params.id };
      if (path.startsWith('/page/author/')) return { author: params.author };
      if (path.startsWith('/page/series/')) return { series: params.series };

      return {};
    });

    return {
      currentRoute,
      currentComponent,
      componentProps,
      isAuthenticated,
      isCheckingAuth
    };
  },
  template: `
        <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center">
            <div class="text-gray-600">Loading...</div>
        </div>
        <div v-else-if="currentComponent === 'Login'">
            <component :is="currentComponent" v-bind="componentProps" />
        </div>
        <div v-else class="max-w-lg mx-auto my-10 px-4 text-lg">
            <Header :currentPath="currentRoute" :isAuthenticated="isAuthenticated" />
            <component :is="currentComponent" v-bind="componentProps" />
            <Footer />
        </div>
    `
};

// Mount the app
createApp(App).mount('#app');
