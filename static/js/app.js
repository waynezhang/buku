const { createApp, ref, reactive, computed, onMounted, onUnmounted } = Vue;

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
                    <a href="#" @click.prevent="navigate('/page/home')" class="text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">buku</a>
                </h1>
                <div class="flex items-center">
                    <button v-if="isAuthenticated" @click="logout" 
                            class="hidden md:block text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        ⏻
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
                       :class="currentPath === '/page/home' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"></path>
                       </svg>
                       Dashboard
                    </a>
                    <a href="#" @click.prevent="navigate('/page/books')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/books' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                       </svg>
                       Books
                    </a>
                    <a href="#" @click.prevent="navigate('/page/authors')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/authors' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                       </svg>
                       Authors
                    </a>
                    <a href="#" @click.prevent="navigate('/page/serieses')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath === '/page/serieses' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                       </svg>
                       Series
                    </a>
                    <a href="#" @click.prevent="navigate('/page/admin')" 
                       class="text-sm transition-colors flex items-center gap-1.5"
                       :class="currentPath.startsWith('/page/admin') ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'">
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
                       :class="currentPath === '/page/home' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'">
                       Dashboard
                    </a>
                    <a href="#" @click.prevent="navigate('/page/books')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/books' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'">
                       Books
                    </a>
                    <a href="#" @click.prevent="navigate('/page/authors')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/authors' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'">
                       Authors
                    </a>
                    <a href="#" @click.prevent="navigate('/page/serieses')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath === '/page/serieses' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'">
                       Series
                    </a>
                    <a href="#" @click.prevent="navigate('/page/admin')" 
                       class="block py-2 px-3 rounded-md text-base font-medium"
                       :class="currentPath.startsWith('/page/admin') ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'">
                       Admin
                    </a>
                    <div v-if="isAuthenticated" class="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                        <button @click="logout" 
                                class="w-full text-left block py-2 px-3 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100">
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
        <footer class="mt-12 pt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
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
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const element = elements[0];
              const year = yearRecords[element.index].year;
              navigate(`/page/books?status=read&year=${year}`);
            }
          },
          onHover: (event, elements) => {
            event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
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
        <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
        <div v-else-if="homeData && homeData.counts" class="space-y-8">
            <div>
                <h2 class="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Statistics</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div @click="navigate('/page/books?status=read')"
                         class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-gray-900 dark:text-gray-100">{{ homeData.counts.finished || 0 }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total Read</div>
                    </div>
                    <div @click="navigate('/page/books?status=read&year=' + new Date().getFullYear())"
                         class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-green-600 dark:text-green-400">{{ homeData.current_year_record.count || 0 }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">This Year</div>
                    </div>
                    <div @click="navigate('/page/books?status=reading')"
                         class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-indigo-600 dark:text-indigo-400">{{ homeData.counts.reading || 0 }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Reading</div>
                    </div>
                    <div @click="navigate('/page/books?status=to-read')"
                         class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div class="text-2xl font-light text-yellow-600 dark:text-yellow-400">{{ homeData.counts.to_read || 0 }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">To Read</div>
                    </div>
                </div>
            </div>
            
            <div v-if="homeData.reading_books && homeData.reading_books.length > 0">
                <h2 class="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Reading</h2>
                <div class="space-y-3">
                    <div v-for="book in homeData.reading_books" :key="book.id" 
                         class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                         @click="navigate('/page/book/' + book.id)">
                        <h3 class="font-normal text-gray-900 dark:text-gray-100">{{ book.title }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ book.author }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Started: {{ formatDate(book.started_at) }}</p>
                    </div>
                </div>
            </div>
            
            <div v-if="homeData.year_records && homeData.year_records.length > 0">
                <h2 class="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">By Year</h2>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <div class="h-64 w-full">
                        <canvas ref="chartCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available
        </div>
    `
};

// Reusable Custom Dropdown Component
const CustomDropdown = {
  props: {
    modelValue: String,
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: 'Select an option'
    },
    label: String,
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const dropdownRef = ref(null);

    const selectedOption = computed(() => {
      return props.options.find(option => option.value === props.modelValue);
    });

    const toggleDropdown = () => {
      if (!props.disabled) {
        isOpen.value = !isOpen.value;
      }
    };

    const selectOption = (option) => {
      emit('update:modelValue', option.value);
      isOpen.value = false;
    };

    const handleClickOutside = (event) => {
      if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      dropdownRef,
      selectedOption,
      toggleDropdown,
      selectOption
    };
  },
  template: `
    <div ref="dropdownRef" class="relative">
      <label v-if="label" class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
        {{ label }}
      </label>
      
      <button type="button" @click="toggleDropdown"
              :disabled="disabled"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span>{{ selectedOption?.label || placeholder }}</span>
        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform" 
             :class="{ 'rotate-180': isOpen }" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      <div v-if="isOpen" 
           class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <div class="py-1">
          <button type="button" v-for="option in options" 
                  :key="option.value"
                  @click="selectOption(option)"
                  class="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  :class="{ 'bg-gray-50 dark:bg-gray-700': modelValue === option.value }">
            <span>{{ option.label }}</span>
            <svg v-if="modelValue === option.value" 
                 class="w-4 h-4 text-gray-600 dark:text-gray-400" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
};

// Books List Component
const BooksList = {
  props: ['status'],
  setup(props) {
    const books = ref([]);
    const allBooks = ref([]);
    const loading = ref(true);
    const currentStatus = ref(props.status || 'all');
    const searchQuery = ref('');
    const yearRecords = ref([]);
    const selectedYear = ref('all');
    const sortBy = ref('title');
    const sortOrder = ref('asc');
    const showSortDropdown = ref(false);

    const fetchBooks = async (status = null) => {
      try {
        loading.value = true;
        const statusToUse = status || currentStatus.value;
        const url = (statusToUse && statusToUse !== 'all') ? `/api/books/${statusToUse}.json` : '/api/books.json';
        allBooks.value = await $json(url);
        filterBooks();
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        loading.value = false;
      }
    };

    const fetchYearRecords = async () => {
      try {
        const homeData = await $json('/api/home.json');
        yearRecords.value = homeData.year_records || [];
      } catch (error) {
        console.error('Error fetching year records:', error);
      }
    };

    const sortBooks = (bookList) => {
      return bookList.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortBy.value) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'author':
            aVal = a.author ? a.author.toLowerCase() : '';
            bVal = b.author ? b.author.toLowerCase() : '';
            break;
          case 'finished_date':
            aVal = a.finished_at ? new Date(a.finished_at) : new Date(0);
            bVal = b.finished_at ? new Date(b.finished_at) : new Date(0);
            break;
          case 'created_date':
            aVal = a.created_at ? new Date(a.created_at) : new Date(0);
            bVal = b.created_at ? new Date(b.created_at) : new Date(0);
            break;
          default:
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
        }
        
        if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
        return 0;
      });
    };

    const filterBooks = () => {
      let filteredBooks = allBooks.value;
      
      // Filter by search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filteredBooks = filteredBooks.filter(book => 
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().includes(query)
        );
      }
      
      // Filter by year if a specific year is selected and status is 'read'
      if (selectedYear.value !== 'all' && currentStatus.value === 'read') {
        const year = parseInt(selectedYear.value);
        filteredBooks = filteredBooks.filter(book => {
          if (book.finished_at) {
            const finishedYear = new Date(book.finished_at).getFullYear();
            return finishedYear === year;
          }
          return false;
        });
      }
      
      // Sort the filtered books
      filteredBooks = sortBooks([...filteredBooks]);
      
      books.value = filteredBooks;
    };

    const navigate = (path) => {
      router.push(path);
    };

    const changeStatus = (newStatus) => {
      currentStatus.value = newStatus;
      selectedYear.value = 'all'; // Reset year filter when changing status
      fetchBooks(newStatus);
      
      // Update URL to reflect the current status
      const newUrl = newStatus === 'all' ? '/page/books' : `/page/books?status=${newStatus}`;
      router.push(newUrl);
    };

    const changeYear = (year) => {
      selectedYear.value = year;
      filterBooks();
    };

    const changeSortBy = (newSortBy) => {
      if (sortBy.value === newSortBy) {
        // Toggle sort order if same field
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        // New field, default to ascending
        sortBy.value = newSortBy;
        sortOrder.value = 'asc';
      }
      showSortDropdown.value = false;
      filterBooks();
    };

    const getSortLabel = (field) => {
      const labels = {
        'title': 'Title',
        'author': 'Author',
        'finished_date': 'Finished Date',
        'created_date': 'Created Date'
      };
      return labels[field];
    };

    const getBookDateDisplay = (book) => {
      if (book.status === 'read' && book.finished_at) {
        return formatDate(book.finished_at);
      }
      return '';
    };

    const getStatusLabel = (status) => {
      if (!status || status === 'all') return 'All Books';
      if (status === 'to-read') return 'To Read';
      if (status === 'reading') return 'Currently Reading';
      if (status === 'read') return 'Read';
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    onMounted(() => {
      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const yearParam = urlParams.get('year');
      if (yearParam && yearParam !== 'all') {
        selectedYear.value = yearParam;
        currentStatus.value = 'read'; // Force read status when year is specified
      }
      
      fetchBooks();
      fetchYearRecords();
    });

    return { 
      books, loading, formatDate, navigate, currentStatus, changeStatus, getStatusLabel, 
      searchQuery, filterBooks, yearRecords, selectedYear, changeYear,
      sortBy, sortOrder, showSortDropdown, changeSortBy, getSortLabel, getBookDateDisplay
    };
  },
  template: `
        <div>
            <div class="mb-4">
                <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{{ getStatusLabel(currentStatus) }} <span class="text-sm text-gray-500 dark:text-gray-400 font-normal">({{ books.length }})</span></h2>
            </div>
            
            <!-- Search and Filter -->
            <div class="mb-6 space-y-4">
                <!-- Search Box and Sort -->
                <div class="flex gap-3">
                    <div class="relative flex-1">
                    <input v-model="searchQuery" @input="filterBooks" 
                           type="text" 
                           placeholder="Search books by title or author..." 
                           class="w-full pl-10 pr-12 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <button v-if="searchQuery" @click="searchQuery = ''; filterBooks()" 
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    </div>
                    
                    <!-- Sort Dropdown -->
                    <div class="relative">
                        <button @click="showSortDropdown = !showSortDropdown" 
                                class="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                            </svg>
                        </button>
                        
                        <!-- Sort Dropdown Menu -->
                        <div v-if="showSortDropdown" 
                             class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 py-1">
                            <button @click="changeSortBy('title')" 
                                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    :class="sortBy === 'title' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900' : 'text-gray-700 dark:text-gray-300'">
                                <span>Title</span>
                                <span v-if="sortBy === 'title'" class="text-xs">
                                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </button>
                            <button @click="changeSortBy('author')" 
                                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    :class="sortBy === 'author' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900' : 'text-gray-700 dark:text-gray-300'">
                                <span>Author</span>
                                <span v-if="sortBy === 'author'" class="text-xs">
                                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </button>
                            <button @click="changeSortBy('finished_date')" 
                                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    :class="sortBy === 'finished_date' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900' : 'text-gray-700 dark:text-gray-300'">
                                <span>Finished Date</span>
                                <span v-if="sortBy === 'finished_date'" class="text-xs">
                                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </button>
                            <button @click="changeSortBy('created_date')" 
                                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    :class="sortBy === 'created_date' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900' : 'text-gray-700 dark:text-gray-300'">
                                <span>Created Date</span>
                                <span v-if="sortBy === 'created_date'" class="text-xs">
                                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Filter Chips -->
                <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button @click="changeStatus('all')" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="currentStatus === 'all' 
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        📋 All
                    </button>
                    <button @click="changeStatus('to-read')" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="currentStatus === 'to-read' 
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        📚 To Read
                    </button>
                    <button @click="changeStatus('reading')" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="currentStatus === 'reading' 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        📖 Reading
                    </button>
                    <button @click="changeStatus('read')" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="currentStatus === 'read' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        ✅ Read
                    </button>
                </div>
                
                <!-- Year Filter (only show when status is 'read') -->
                <div v-if="currentStatus === 'read' && yearRecords.length > 0" class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button @click="changeYear('all')" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="selectedYear === 'all' 
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-500 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        📅 All Years
                    </button>
                    <button v-for="record in yearRecords.slice().sort((a, b) => b.year - a.year)" 
                            :key="record.year"
                            @click="changeYear(record.year.toString())" 
                            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            :class="selectedYear === record.year.toString() 
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-500 shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'">
                        {{ record.year }} ({{ record.count }})
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500">
                No books found
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate(\`/page/book/\${book.id}\`)">
                    <h3 class="font-normal text-gray-900 dark:text-gray-100">{{ book.title }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ book.author }}</p>
                    <div class="flex justify-between items-center mt-3">
                        <span class="text-xs font-medium px-3 py-1 rounded-lg"
                              :class="{
                                  'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': book.status === 'read',
                                  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300': book.status === 'reading',
                                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': book.status === 'to-read'
                              }">
                            {{ book.status === 'to-read' ? 'To Read' : book.status === 'reading' ? 'Reading' : 'Read' }}
                        </span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ getBookDateDisplay(book) }}</span>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Book View Component
const BookView = {
  components: {
    CustomDropdown
  },
  props: ['bookId'],
  setup(props) {
    const book = ref(null);
    const loading = ref(true);

    const statusOptions = [
      { value: 'to-read', label: 'To Read' },
      { value: 'reading', label: 'Currently Reading' },
      { value: 'read', label: 'Finished' }
    ];

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

    return { 
      book, loading, formatDate, navigate, changeStatus, deleteBook, statusOptions
    };
  },
  template: `
        <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
        <div v-else-if="book" class="space-y-6">
            <!-- Header Section with Book Info -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 md:p-8 rounded-xl shadow-sm">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div class="flex-1 mb-4 md:mb-0">
                        <div class="mb-3">
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                                  :class="{
                                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300': book.status === 'read',
                                      'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300': book.status === 'reading',
                                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300': book.status === 'to-read'
                                  }">
                                {{ book.status.replace('-', ' ').toUpperCase() }}
                            </span>
                        </div>
                        <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                            <div>
                                <h1 class="text-2xl md:text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">{{ book.title }}</h1>
                                <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-3">by {{ book.author }}</p>
                            </div>
                            <div class="flex space-x-2 mt-4 md:flex-col md:space-y-2 md:space-x-0 md:mt-0 md:ml-4">
                                <button @click="navigate('/page/book/' + book.id + '/edit')" 
                                        class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center text-sm">
                                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Edit
                                </button>
                                <button @click="deleteBook" 
                                        class="bg-red-600 dark:bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center text-sm">
                                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div v-if="book.series" class="flex items-center text-gray-500 dark:text-gray-400 mt-3">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <span class="text-sm text-gray-700 dark:text-gray-300">{{ book.series }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reading Progress Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Reading Status
                    </h3>
                    <div class="space-y-4">
                        <CustomDropdown
                            v-model="book.status"
                            :options="statusOptions"
                            label="Current Status"
                            @update:modelValue="changeStatus"
                        />
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Timeline
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Started</span>
                            <span class="text-sm font-medium" :class="book.started_at ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'">
                                {{ formatDate(book.started_at) || 'Not started' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Finished</span>
                            <span class="text-sm font-medium" :class="book.finished_at ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'">
                                {{ formatDate(book.finished_at) || 'Not finished' }}
                            </span>
                        </div>
                        <div v-if="book.started_at && book.finished_at" class="flex items-center justify-between py-2 border-t pt-3">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Reading time</span>
                            <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {{ Math.ceil((new Date(book.finished_at) - new Date(book.started_at)) / (1000 * 60 * 60 * 24)) }} days
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Book Details Section -->
            <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Book Details
                </h3>
                <div class="space-y-4">
                    <div v-if="book.isbn">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">ISBN</label>
                        <p class="mt-1 text-gray-900 dark:text-gray-100 font-mono text-sm">{{ book.isbn }}</p>
                    </div>
                    <div v-if="book.comments">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Comments</label>
                        <div class="mt-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-indigo-200 dark:border-indigo-600">
                            <p class="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{{ book.comments }}</p>
                        </div>
                    </div>
                    <div v-if="!book.isbn && !book.comments" class="text-center py-4 text-gray-500 dark:text-gray-400">
                        No additional details available
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Quick Actions
                </h3>
                <div class="flex flex-wrap gap-2">
                    <button v-if="book.status === 'to-read'" @click="changeStatus('reading')"
                            class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm">
                        📖 Start Reading
                    </button>
                    <button v-if="book.status === 'reading'" @click="changeStatus('read')"
                            class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm">
                        ✅ Mark as Finished
                    </button>
                    <button v-if="book.author" @click="navigate('/page/author/' + encodeURIComponent(book.author))"
                            class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                        👤 View Author's Books
                    </button>
                    <button v-if="book.series" @click="navigate('/page/series/' + encodeURIComponent(book.series))"
                            class="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm">
                        📚 View Series Books
                    </button>
                </div>
            </div>
        </div>
    `
};

// Book Edit Component
const BookEdit = {
  components: {
    CustomDropdown
  },
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

    const statusOptions = [
      { value: 'to-read', label: 'To Read' },
      { value: 'reading', label: 'Reading' },
      { value: 'read', label: 'Read' }
    ];

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

    const handleStatusChange = (newStatus) => {
      book.status = newStatus;
      
      // Auto-set dates based on status  
      const today = formatDate(new Date());
      
      if (newStatus === 'reading') {
        // When changing to "Reading", set started date to today only if empty, and clear finished date
        if (!book.started_at) {
          book.started_at = today;
        }
        book.finished_at = '';
      } else if (newStatus === 'read') {
        // When changing to "Read", set both dates if not already set
        if (!book.started_at) {
          book.started_at = today;
        }
        if (!book.finished_at) {
          book.finished_at = today;
        }
      } else if (newStatus === 'to-read') {
        // When changing to "To Read", clear dates
        book.started_at = '';
        book.finished_at = '';
      }
    };

    const cancelEdit = () => {
      if (props.bookId) {
        // If editing an existing book, go back to that book's detail view
        router.push(`/page/book/${props.bookId}`);
      } else {
        // If creating a new book, go back to books list
        router.push('/page/books');
      }
    };

    onMounted(() => {
      fetchBook();
      fetchAuthorsAndSeries();
    });

    return {
      book, loading, saving, saveBook, searchGoogleBooks, router,
      searching, searchResults, showSearchResults, lastSearchQuery, selectGoogleBook, closeSearchResults,
      filteredAuthors, filteredSeries, showAuthorDropdown, showSeriesDropdown,
      selectAuthor, selectSeries, onAuthorInput, onSeriesInput, cancelEdit, statusOptions, handleStatusChange
    };
  },
  template: `
        <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
        <div v-else class="space-y-6">
            <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">{{ bookId ? 'Edit Book' : 'Add New Book' }}</h2>
            
            <form @submit.prevent="saveBook" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
                <div class="flex space-x-2">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Title</label>
                        <input v-model="book.title" type="text" required
                               class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <button type="button" @click="searchGoogleBooks" :disabled="searching"
                            class="mt-6 bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm flex items-center gap-1">
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
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Select a Book</h3>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Searched: {{ lastSearchQuery }}</p>
                                </div>
                                <button @click="closeSearchResults" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div v-for="result in searchResults" :key="result.id" 
                                     @click="selectGoogleBook(result)"
                                     class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ result.title }}</h4>
                                    <p v-if="result.author" class="text-sm text-gray-600 dark:text-gray-400 mt-1">by {{ result.author }}</p>
                                    <p v-if="result.isbn" class="text-xs text-gray-500 dark:text-gray-400 mt-1">ISBN: {{ result.isbn }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="relative">
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Author</label>
                    <input :value="book.author" @input="onAuthorInput" type="text" required
                           @focus="filterAuthors(book.author)"
                           @blur="setTimeout(() => showAuthorDropdown = false, 150)"
                           class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    <div v-if="showAuthorDropdown" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <button v-for="author in filteredAuthors" :key="author" @click="selectAuthor(author)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:bg-indigo-50 dark:focus:bg-indigo-900 focus:outline-none text-sm text-gray-900 dark:text-gray-100">
                            {{ author }}
                        </button>
                    </div>
                </div>
                
                <div class="relative">
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Series</label>
                    <input :value="book.series" @input="onSeriesInput" type="text"
                           @focus="filterSeries(book.series)"
                           @blur="setTimeout(() => showSeriesDropdown = false, 150)"
                           class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    <div v-if="showSeriesDropdown" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <button v-for="s in filteredSeries" :key="s" @click="selectSeries(s)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:bg-indigo-50 dark:focus:bg-indigo-900 focus:outline-none text-sm text-gray-900 dark:text-gray-100">
                            {{ s }}
                        </button>
                    </div>
                </div>
                
                <CustomDropdown
                    :modelValue="book.status"
                    :options="statusOptions"
                    label="Status"
                    @update:modelValue="handleStatusChange"
                />
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Started Date</label>
                        <input v-model="book.started_at" type="date"
                               class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Finished Date</label>
                        <input v-model="book.finished_at" type="date"
                               class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">ISBN</label>
                    <input v-model="book.isbn" type="text"
                           class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Comments</label>
                    <textarea v-model="book.comments" rows="4"
                              class="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"></textarea>
                </div>
                
                <div class="flex justify-between">
                    <button type="button" @click="cancelEdit"
                            class="bg-gray-600 dark:bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm transition-colors">
                        Cancel
                    </button>
                    <button type="submit" :disabled="saving"
                            class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm transition-colors">
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
    const allAuthors = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');

    const fetchAuthors = async () => {
      try {
        loading.value = true;
        allAuthors.value = await $json('/api/authors.json');
        filterAuthors();
      } catch (error) {
        console.error('Error fetching authors:', error);
      } finally {
        loading.value = false;
      }
    };

    const filterAuthors = () => {
      if (!searchQuery.value.trim()) {
        authors.value = allAuthors.value;
      } else {
        const query = searchQuery.value.toLowerCase();
        authors.value = allAuthors.value.filter(author => 
          author.name.toLowerCase().includes(query)
        );
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    onMounted(fetchAuthors);

    return { authors, loading, navigate, searchQuery, filterAuthors };
  },
  template: `
        <div>
            <div class="mb-4">
                <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Authors <span class="text-sm text-gray-500 dark:text-gray-400 font-normal">({{ authors.length }})</span></h2>
            </div>
            
            <!-- Search Box -->
            <div class="mb-4">
                <div class="relative">
                    <input v-model="searchQuery" @input="filterAuthors" 
                           type="text" 
                           placeholder="Search authors..." 
                           class="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <button v-if="searchQuery" @click="searchQuery = ''; filterAuthors()" 
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
            <div v-else-if="authors.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No authors found
            </div>
            <div v-else class="space-y-2">
                <div v-for="author in authors" :key="author.name" 
                     class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-3 border-indigo-200 dark:border-indigo-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                     @click="navigate('/page/author/' + encodeURIComponent(author.name))">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-3">
                                <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ author.name }}</h3>
                                <p class="text-xs text-gray-600 dark:text-gray-400">{{ author.count }} {{ author.count === 1 ? 'book' : 'books' }}</p>
                            </div>
                        </div>
                        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    const allSeries = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');

    const fetchSeries = async () => {
      try {
        loading.value = true;
        allSeries.value = await $json('/api/series.json');
        filterSeries();
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        loading.value = false;
      }
    };

    const filterSeries = () => {
      if (!searchQuery.value.trim()) {
        series.value = allSeries.value;
      } else {
        const query = searchQuery.value.toLowerCase();
        series.value = allSeries.value.filter(s => 
          s.name.toLowerCase().includes(query)
        );
      }
    };

    const navigate = (path) => {
      router.push(path);
    };

    onMounted(fetchSeries);

    return { series, loading, navigate, searchQuery, filterSeries };
  },
  template: `
        <div>
            <div class="mb-4">
                <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Series <span class="text-sm text-gray-500 dark:text-gray-400 font-normal">({{ series.length }})</span></h2>
            </div>
            
            <!-- Search Box -->
            <div class="mb-4">
                <div class="relative">
                    <input v-model="searchQuery" @input="filterSeries" 
                           type="text" 
                           placeholder="Search series..." 
                           class="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <button v-if="searchQuery" @click="searchQuery = ''; filterSeries()" 
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
            <div v-else-if="series.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No series found
            </div>
            <div v-else class="space-y-2">
                <div v-for="s in series" :key="s.name" 
                     class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-3 border-indigo-200 dark:border-indigo-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                     @click="navigate('/page/series/' + encodeURIComponent(s.name))">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-3">
                                <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ s.name }}</h3>
                                <p class="text-xs text-gray-600 dark:text-gray-400">{{ s.count }} {{ s.count === 1 ? 'book' : 'books' }}</p>
                            </div>
                        </div>
                        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 class="text-base font-medium text-gray-900 dark:text-gray-100">Admin</h2>
            
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3">
                <div>
                    <h3 class="text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-100">Import Data</h3>
                    <button @click="navigate('/page/admin/import')"
                            class="bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-xs">
                        Import from CSV
                    </button>
                </div>
                
                <div>
                    <h3 class="text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-100">Export Data</h3>
                    <button @click="exportData"
                            class="bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-xs">
                        Export to CSV
                    </button>
                </div>
                
                <div>
                    <h3 class="text-sm font-medium mb-1.5 text-red-600 dark:text-red-400">Danger Zone</h3>
                    <button @click="deleteAll"
                            class="bg-red-600 dark:bg-red-500 text-white px-2.5 py-1 rounded-md hover:bg-red-700 dark:hover:bg-red-600 text-xs">
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
            <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">Import Data</h2>
            
            <!-- Step 1: Select File -->
            <div v-if="step === 1" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Select CSV File</label>
                    <input type="file" accept=".csv" @change="handleFileChange"
                           class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800">
                </div>
                
                <div class="flex justify-start">
                    <button @click="router.push('/page/admin')"
                            class="bg-gray-600 dark:bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm">
                        Cancel
                    </button>
                </div>
            </div>
            
            <!-- Step 2: Map Columns -->
            <div v-if="step === 2" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
                <div>
                    <h3 class="font-medium mb-4 text-gray-900 dark:text-gray-100">Map CSV Columns to Book Fields</h3>
                    <div class="space-y-3">
                        <div v-for="field in Object.keys(columnMapping)" :key="field" 
                             class="flex items-center justify-between">
                            <label class="text-sm font-medium text-gray-600 dark:text-gray-400 w-24">{{ field }}:</label>
                            <select v-model="columnMapping[field]" 
                                    class="flex-1 ml-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option v-for="column in csvData.columns" :key="column" :value="column">
                                    {{ column === '-' ? '(Skip this field)' : column }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div v-if="csvData && csvData.columns">
                    <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Available CSV Columns:</h4>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="column in csvData.columns.slice(1)" :key="column" 
                              class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">
                            {{ column }}
                        </span>
                    </div>
                </div>
                
                <div class="flex justify-between">
                    <button @click="goBack"
                            class="bg-gray-600 dark:bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm">
                        Back
                    </button>
                    <button @click="importData" :disabled="importing"
                            class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm">
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

    const getBookDateDisplay = (book) => {
      if (book.status === 'read' && book.finished_at) {
        return formatDate(book.finished_at);
      }
      return '';
    };

    onMounted(fetchAuthorBooks);

    return {
      books, loading, navigate, formatDate,
      showRenameModal, newAuthorName, renaming,
      openRenameModal, closeRenameModal, renameAuthor, getBookDateDisplay
    };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <button @click="navigate('/page/authors')" 
                            class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">{{ author }}</h2>
                </div>
                <button @click="openRenameModal"
                        class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm flex items-center transition-colors">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Rename
                </button>
            </div>
            
            <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No books found by this author
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate('/page/book/' + book.id)">
                    <h3 class="font-normal text-gray-900 dark:text-gray-100">{{ book.title }}</h3>
                    <p v-if="book.series" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ book.series }}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs px-2 py-1 rounded" 
                              :class="{
                                  'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': book.status === 'read',
                                  'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200': book.status === 'reading',
                                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200': book.status === 'to-read'
                              }">
                            {{ book.status.replace('-', ' ') }}
                        </span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ getBookDateDisplay(book) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Rename Modal -->
            <div v-if="showRenameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeRenameModal">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4" @click.stop>
                    <h3 class="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Rename Author</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Author Name</label>
                        <input v-model="newAuthorName" type="text" 
                               @keyup.enter="renameAuthor"
                               @keyup.escape="closeRenameModal"
                               class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <div class="flex justify-between">
                        <button @click="closeRenameModal"
                                class="bg-gray-600 dark:bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm transition-colors">
                            Cancel
                        </button>
                        <button @click="renameAuthor" :disabled="renaming"
                                class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm transition-colors">
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

    const getBookDateDisplay = (book) => {
      if (book.status === 'read' && book.finished_at) {
        return formatDate(book.finished_at);
      }
      return '';
    };

    onMounted(fetchSeriesBooks);

    return {
      books, loading, navigate, formatDate,
      showRenameModal, newSeriesName, renaming,
      openRenameModal, closeRenameModal, renameSeries, getBookDateDisplay
    };
  },
  template: `
        <div>
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <button @click="navigate('/page/serieses')" 
                            class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">{{ series }}</h2>
                </div>
                <button @click="openRenameModal"
                        class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm flex items-center transition-colors">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Rename
                </button>
            </div>
            
            <div v-if="loading" class="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
            <div v-else-if="books.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No books found in this series
            </div>
            <div v-else class="space-y-3">
                <div v-for="book in books" :key="book.id" 
                     class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     @click="navigate('/page/book/' + book.id)">
                    <h3 class="font-normal text-gray-900 dark:text-gray-100">{{ book.title }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ book.author }}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs px-2 py-1 rounded" 
                              :class="{
                                  'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': book.status === 'read',
                                  'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200': book.status === 'reading',
                                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200': book.status === 'to-read'
                              }">
                            {{ book.status.replace('-', ' ') }}
                        </span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ getBookDateDisplay(book) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Rename Modal -->
            <div v-if="showRenameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeRenameModal">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4" @click.stop>
                    <h3 class="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Rename Series</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Series Name</label>
                        <input v-model="newSeriesName" type="text" 
                               @keyup.enter="renameSeries"
                               @keyup.escape="closeRenameModal"
                               class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                    </div>
                    <div class="flex justify-between">
                        <button @click="closeRenameModal"
                                class="bg-gray-600 dark:bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm transition-colors">
                            Cancel
                        </button>
                        <button @click="renameSeries" :disabled="renaming"
                                class="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm transition-colors">
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
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div class="w-full max-w-sm mx-auto">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                    <div class="text-center mb-8">
                        <h1 class="text-2xl font-light text-gray-900 dark:text-gray-100">buku</h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Sign in to continue</p>
                    </div>
                    
                    <form @submit="handleSubmit" class="space-y-6">
                        <div>
                            <input v-model="username" id="username" type="text" required
                                   placeholder="Username"
                                   class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-colors">
                        </div>
                        <div>
                            <input v-model="password" id="password" type="password" required
                                   placeholder="Password"
                                   class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-colors">
                        </div>

                        <div v-if="error" class="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2">
                            {{ error }}
                        </div>

                        <button type="submit" :disabled="loading"
                                class="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 text-sm font-medium transition-colors">
                            {{ loading ? 'Signing in...' : 'Sign in' }}
                        </button>
                    </form>
                </div>
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
    const showUpdatePrompt = ref(false);
    const updateRegistration = ref(null);

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

    // Service Worker Update Handling
    const handleUpdate = () => {
      if (updateRegistration.value) {
        const newWorker = updateRegistration.value.waiting;
        if (newWorker) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      showUpdatePrompt.value = false;
    };

    const dismissUpdate = () => {
      showUpdatePrompt.value = false;
    };

    // Check auth on mount and when route changes
    onMounted(() => {
      checkAuth();
      
      // Set up service worker event listeners
      if ('serviceWorker' in navigator) {
        window.addEventListener('sw-update-available', (event) => {
          updateRegistration.value = event.detail.registration;
          showUpdatePrompt.value = true;
        });

        window.addEventListener('sw-updated', () => {
          // Reload the page when SW is updated
          window.location.reload();
        });
      }
    });

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

      if (path === '/page/books') return { status: params.status };
      if (path === '/page/backlog') return { status: 'to-read' };
      if (path === '/page/book/new') return {}; // For new book, don't pass bookId
      if (path.startsWith('/page/book/') && path.endsWith('/edit')) return { bookId: params.id };
      if (path.startsWith('/page/book/')) return { bookId: params.id };
      if (path.startsWith('/page/author/')) return { author: params.author };
      if (path.startsWith('/page/series/')) return { series: params.series };

      return {};
    });

    const navigate = (path) => {
      router.push(path);
    };

    return {
      currentRoute,
      currentComponent,
      componentProps,
      isAuthenticated,
      isCheckingAuth,
      showUpdatePrompt,
      handleUpdate,
      dismissUpdate,
      navigate
    };
  },
  template: `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div v-if="isCheckingAuth" class="flex items-center justify-center h-screen">
            <div class="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
        <div v-else-if="currentComponent === 'Login'">
            <component :is="currentComponent" v-bind="componentProps" />
        </div>
        <div v-else class="max-w-lg mx-auto py-10 px-4 text-lg">
            <Header :currentPath="currentRoute" :isAuthenticated="isAuthenticated" />
            <component :is="currentComponent" v-bind="componentProps" />
            <Footer />
            
            <!-- Floating Action Button -->
            <div class="fixed bottom-6 right-6 z-40">
                <button @click="navigate('/page/book/new')" 
                        class="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                        title="Add Book">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                </button>
            </div>
            
            <!-- PWA Update Prompt -->
            <div v-if="showUpdatePrompt" class="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
                <div class="text-sm font-medium mb-3">App Update Available</div>
                <div class="flex space-x-2">
                    <button @click="handleUpdate" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
                        Update
                    </button>
                    <button @click="dismissUpdate" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                        Later
                    </button>
                </div>
            </div>
        </div>
        </div>
    `
};

// Mount the app
createApp(App).mount('#app');
